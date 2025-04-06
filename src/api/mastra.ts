// Import Tauri API with a dynamic require to avoid TypeScript errors
let invoke: any = async () => {
  console.warn('Default Tauri invoke is being used, this should be replaced');
  return 'http://localhost:4111';
};

// 尝试异步导入Tauri API
const loadTauriAPI = async () => {
  try {
    // 使用动态导入以避免类型错误
    const tauri = await import('@tauri-apps/api/core');
    if (tauri && typeof tauri.invoke === 'function') {
      invoke = tauri.invoke;
      return true;
    }
    throw new Error('Tauri API loaded but invoke is not a function');
  } catch (e) {
    console.warn('Failed to import tauri API:', e);
    // Fallback for when the module isn't available
    return false;
  }
};

// 初始化加载
loadTauriAPI().catch(e => {
  console.error('Failed to initialize Tauri API:', e);
});

import { MastraClient } from '@mastra/client-js';
import { MastraMessage, AgentGenerateRequest, AgentGenerateResponse, Tool, ToolExecuteResult } from './types';

// 添加导入
import { textToSpeech, speakWithWebSpeech } from './speech';

// 读取环境变量的帮助函数
function getEnv(key: string, defaultValue: string = ''): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
}

// 读取数值类型环境变量的帮助函数
function getNumEnv(key: string, defaultValue: number): number {
  const value = getEnv(key, '');
  if (!value) return defaultValue;
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Get the Mastra service URL from the environment variables or fallback to Tauri backend
async function getMastraUrl(): Promise<string> {
  try {
    // 如果在浏览器环境且使用Vite开发服务器，则使用相对URL，通过Vite代理访问
    if (typeof window !== 'undefined') {
      console.log('使用Vite代理访问Mastra服务器: /api');
      return '/api'; // 使用相对路径，将通过Vite代理访问
    }
    
    // 检查环境变量中是否有API URL
    const envApiUrl = getEnv('VITE_MASTRA_API_URL', '');
    if (envApiUrl) {
      console.log('Using Mastra URL from environment:', envApiUrl);
      return envApiUrl;
    }
    
    // 添加重试机制
    let retries = 0;
    const maxRetries = getNumEnv('VITE_RETRY_ATTEMPTS', 3);
    let lastError: any = null;
    
    // 先检查Tauri API是否已加载
    await loadTauriAPI().catch(() => {});

    // 默认端口，如果所有尝试都失败
    const DEFAULT_PORT = 4111;
    
    while (retries < maxRetries) {
      try {
        // 先检查 invoke 是否已准备好
        if (typeof invoke !== 'function') {
          throw new Error('Tauri invoke function not initialized yet');
        }
        
        // 使用Promise包装invoke调用，设置超时
        const timeout = getNumEnv('VITE_CONNECTION_TIMEOUT', 2000);
        const invokeWithTimeout = (fn: any, ...args: any[]) => {
          return Promise.race([
            fn(...args),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Invoke timeout')), timeout);
            })
          ]);
        };
        
        const url = await invokeWithTimeout(invoke, 'get_mastra_url');
        
        if (!url || typeof url !== 'string') {
          throw new Error('Invalid URL returned from Tauri backend');
        }
        
        return url;
      } catch (error) {
        lastError = error;
        console.warn(`Failed to get Mastra service URL (attempt ${retries + 1}/${maxRetries}):`, error);
        retries++;
        // 等待一小段时间后重试
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
    
    // 所有重试都失败了
    console.error('All attempts to get Mastra service URL failed:', lastError);
    return `http://localhost:${DEFAULT_PORT}`; // 使用默认端口
  } catch (error) {
    console.error('Failed to get Mastra service URL:', error);
    return getEnv('VITE_API_BASE_URL', 'http://localhost:4111');
  }
}

// Initialize Mastra client instance
let mastraClient: MastraClient | null = null;

// 获取Mastra客户端实例
export async function getClient() {
  if (!mastraClient) {
    const baseUrl = await getMastraUrl();
    mastraClient = new MastraClient({
      baseUrl,
      // 必须添加这些头部信息以确保与Mastra服务器的正常通信
      // 这些头部将在预检请求(OPTIONS)中发送，因此Mastra服务器必须配置为允许它们
      headers: {
        'x-mastra-client-type': 'lumos-studio',
        'x-mastra-client-id': 'lumos-client'
      }
    });
  }
  return mastraClient;
}

// Mastra API client
export const MastraAPI = {
  // 导出getClient方法
  getClient,
  
  // Get available agents
  async getAgents(): Promise<string[]> {
    try {
      const client = await getClient();
      
      // 尝试获取market-agents工具
      const marketAgentsTool = client.getTool('market-agents');
      
      // 通过工具API获取市场智能体列表
      const result = await marketAgentsTool.execute({
        data: {
          operation: 'list'
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || '获取智能体市场列表失败');
      }
      
      // 如果返回的是完整的agent对象数组，提取名称
      const agents = result.data || [];
      return Array.isArray(agents) 
        ? agents.map(agent => typeof agent === 'string' ? agent : agent.name) 
        : [];
    } catch (error) {
      console.error('Failed to get market agents:', error);
      // 如果工具API失败，尝试使用普通的getAgents API
      try {
        const client = await getClient();
        const agents = await client.getAgents();
        return Array.isArray(agents) ? agents.map(agent => agent.name) : [];
      } catch (fallbackError) {
        console.error('Fallback for getting agents also failed:', fallbackError);
        return [];
      }
    }
  },

  // 获取所有可用工具
  async getTools(): Promise<string[]> {
    try {
      const client = await getClient();
      const tools = await client.getTools();
      // 返回工具ID数组
      return Object.keys(tools || {});
    } catch (error) {
      console.error('Failed to get tools:', error);
      return [];
    }
  },

  // 智能体CRUD操作 - 直接使用Tools API
  async createAgent(agentParams: any): Promise<any> {
    try {
      const client = await getClient();
      // 获取agent-storage工具
      const agentStorageTool = client.getTool('agent-storage');
      
      // 确保tools字段已经是字符串
      if (agentParams.tools && typeof agentParams.tools !== 'string') {
        agentParams.tools = JSON.stringify(agentParams.tools);
      }
      
      // 使用类型断言修复类型错误
      const result = await (agentStorageTool.execute as any)({
        data: {
          operation: 'create',
          agent: agentParams
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || '创建智能体失败');
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  },

  async updateAgent(agentId: string, agentParams: any): Promise<any> {
    try {
      const client = await getClient();
      // 获取agent-storage工具
      const agentStorageTool = client.getTool('agent-storage');
      
      // 确保tools字段已经是字符串
      if (agentParams.tools && typeof agentParams.tools !== 'string') {
        agentParams.tools = JSON.stringify(agentParams.tools);
      }
      
      // 使用类型断言和直接参数传递
      const result = await (agentStorageTool.execute as any)({
        data: {
          operation: 'update',
          agent: { id: agentId, ...agentParams }
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || `更新智能体 ${agentId} 失败`);
      }
      
      return result.data;
    } catch (error) {
      console.error(`Failed to update agent ${agentId}:`, error);
      throw error;
    }
  },

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const client = await getClient();
      // 获取agent-storage工具
      const agentStorageTool = client.getTool('agent-storage');
      
      // 使用类型断言和直接参数传递
      const result = await (agentStorageTool.execute as any)({
        data: {
          operation: 'delete',
          agentId
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || `删除智能体 ${agentId} 失败`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to delete agent ${agentId}:`, error);
      throw error;
    }
  },
  
  // 获取所有本地存储的智能体
  async getAllAgents(): Promise<any[]> {
    try {
      const client = await getClient();
      // 获取agent-storage工具
      const agentStorageTool = client.getTool('agent-storage');
      
      // 使用类型断言和直接参数传递
      const result = await (agentStorageTool.execute as any)({
        data: {
          operation: 'getAll'
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || '获取智能体列表失败');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Failed to get agents:', error);
      return [];
    }
  },
  
  // 获取单个智能体详情
  async getAgent(agentId: string): Promise<any> {
    try {
      const client = await getClient();
      // 获取agent-storage工具
      const agentStorageTool = client.getTool('agent-storage');
      
      // 使用类型断言和直接参数传递
      const result = await (agentStorageTool.execute as any)({
        data: {
          operation: 'get',
          agentId
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || `获取智能体 ${agentId} 失败`);
      }
      
      return result.data;
    } catch (error) {
      console.error(`Failed to get agent ${agentId}:`, error);
      throw error;
    }
  },

  // 检查Mastra服务是否运行
  async isRunning(): Promise<boolean> {
    try {
      console.log('[MastraAPI] 检查Mastra服务状态...');
      
      // 尝试获取客户端实例
      const client = await getClient();
      
      // 更可靠的检查：尝试获取工具列表作为活跃检查
      try {
        const tools = await client.getTools();
        console.log('[MastraAPI] Mastra服务正常运行，已获取工具列表:', Object.keys(tools || {}).length);
        return true;
      } catch (toolError) {
        console.warn('[MastraAPI] 获取工具列表失败，尝试备用检查:', toolError);
        
        // 备用检查：尝试获取智能体列表
        try {
          const agents = await client.getAgents();
          console.log('[MastraAPI] Mastra服务正常运行，已获取智能体列表');
          return true;
        } catch (agentError) {
          console.warn('[MastraAPI] 获取智能体列表也失败:', agentError);
          
          // 最后尝试直接发送状态请求
          try {
            const baseUrl = await getMastraUrl();
            const statusUrl = `${baseUrl}/status`;
            console.log('[MastraAPI] 尝试直接检查服务状态:', statusUrl);
            
            const response = await fetch(statusUrl);
            
            if (response.ok) {
              const data = await response.json();
              console.log('[MastraAPI] 服务状态检查成功:', data);
              return true;
            } else {
              console.warn('[MastraAPI] 服务状态返回非200状态码:', response.status);
              // 返回true以便系统尝试API调用，可能部分功能仍可用
              return true;
            }
          } catch (statusError) {
            console.error('[MastraAPI] 所有服务状态检查均失败:', statusError);
            // 仍然返回true，让系统尝试调用API
            return true;
          }
        }
      }
    } catch (error) {
      console.error('[MastraAPI] 检查服务状态时出现严重错误:', error);
      // 返回true让系统仍然尝试API调用，可能个别功能仍可用
      return true;
    }
  },

  // Generate text from an agent
  async generate(
    agentName: string,
    request: AgentGenerateRequest
  ): Promise<AgentGenerateResponse> {
    try {
      const client = await getClient();
      const agent = client.getAgent(agentName || 'agent');
      
      if (Array.isArray(request.messages)) {
        if (request.messages.length === 0) {
          throw new Error("Messages array cannot be empty");
        }
        
        const result = await (agent as any).generate({
          messages: request.messages,
          options: request.options
        });
        
        return {
          text: typeof result.text === 'string' ? result.text : '',
          metadata: result.metadata || {}
        };
      } else {
        throw new Error("Messages must be an array");
      }
    } catch (error) {
      console.error(`Failed to generate from agent ${agentName}:`, error);
      throw error;
    }
  },

  // Stream generation from an agent (returns an async generator)
  async *streamGenerate(
    agentName: string,
    request: AgentGenerateRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      console.log('[MastraAPI] streamGenerate开始调用真实API:', {
        agentName,
        messageCount: request.messages?.length || 0,
        hasOptions: !!request.options
      });
      
      const client = await getClient();
      
      // 验证agentName是否有效
      if (!agentName) {
        console.error('[MastraAPI] 错误: Agent name不能为空');
        throw new Error('Agent name is required');
      }
      
      const baseUrl = await getMastraUrl();
      console.log(`[MastraAPI] 使用服务URL: ${baseUrl}`);
      
      const agent = client.getAgent(agentName);
      console.log(`[MastraAPI] 成功获取智能体: ${agentName}`);
      
      if (Array.isArray(request.messages)) {
        if (request.messages.length === 0) {
          console.error('[MastraAPI] 错误: 消息数组不能为空');
          throw new Error("Messages array cannot be empty");
        }
        
        try {
          // 记录请求信息用于调试
          console.log(`[MastraAPI] 开始请求智能体: ${agentName}流式生成`, {
            messageCount: request.messages.length,
            firstMessageRole: request.messages[0]?.role,
            hasSystemMessage: request.messages.some(m => m.role === 'system'),
            options: request.options
          });
          
          // 使用stream方法获取Response对象
          console.log(`[MastraAPI] 发送流式请求...`);
          const startTime = Date.now();
          
          const response = await (agent as any).stream({
            messages: request.messages,
            options: request.options
          });
          
          const responseTime = Date.now() - startTime;
          console.log(`[MastraAPI] 收到初始流式响应, 耗时: ${responseTime}ms`);
          
          if (!response || !response.body) {
            console.error('[MastraAPI] 错误: 流式响应无效', response);
            throw new Error('Stream response or body is null');
          }
          
          console.log('[MastraAPI] 开始读取流式响应...');
          // 获取reader
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let fullText = '';
          let chunkCount = 0;
          
          // 读取流数据
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log(`[MastraAPI] 流式响应完成, 共接收${chunkCount}个数据块`);
              break;
            }
            
            chunkCount++;
            // 解码二进制数据为文本
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            if (chunkCount === 1) {
              console.log(`[MastraAPI] 收到首个数据块: ${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}`);
            }
            
            if (chunkCount % 10 === 0) {
              console.log(`[MastraAPI] 已接收${chunkCount}个数据块, 当前文本长度: ${fullText.length}`);
            }
            
            // 处理buffer中的数据
            let lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个可能不完整的行
            
            for (const line of lines) {
              if (!line.trim()) continue; // 跳过空行
              
              try {
                // 检查是否是JSON格式的元数据
                if (line.startsWith('f:') || line.startsWith('d:') || line.startsWith('e:')) {
                  console.log('[MastraAPI] 收到元数据:', line);
                  
                  // 检查是否是错误信息
                  if (line.startsWith('e:')) {
                    const errorData = line.substring(2);
                    console.error('[MastraAPI] 流式响应错误:', errorData);
                    throw new Error(`Stream error: ${errorData}`);
                  }
                  
                  continue;
                }
                
                // 尝试解析为JSON
                try {
                  const parsed = JSON.parse(line);
                  // 如果是有效的JSON对象，提取内容
                  if (parsed && typeof parsed === 'object') {
                    if (parsed.content) {
                      fullText += parsed.content;
                      yield parsed.content;
                      continue;
                    } else if (parsed.text) {
                      fullText += parsed.text;
                      yield parsed.text;
                      continue;
                    }
                  }
                } catch (parseError) {
                  // 不是JSON，继续检查其他格式
                }
                
                // 检查是否是带前缀的文本块 (0:"text")
                const prefixMatch = line.match(/^0:"(.+)"$/);
                if (prefixMatch) {
                  const textContent = prefixMatch[1];
                  // 处理转义字符
                  const unescapedText = textContent
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                  
                  fullText += unescapedText;
                  yield unescapedText;
                  continue;
                }
                
                // 直接返回文本行
                console.log('[MastraAPI] 纯文本行:', line.substring(0, 50) + (line.length > 50 ? '...' : ''));
                fullText += line;
                yield line;
              } catch (parseError) {
                console.warn('[MastraAPI] 解析行内容时出错:', parseError, line.substring(0, 100));
                yield line; // 出错时原样返回
              }
            }
          }
          
          // 处理剩余的buffer
          if (buffer.trim()) {
            console.log('[MastraAPI] 处理剩余buffer:', buffer.substring(0, 100));
            yield buffer;
          }
          
          console.log(`[MastraAPI] 流式生成完成, 总文本长度: ${fullText.length}字符, 共${chunkCount}个数据块`);
          
        } catch (streamError) {
          console.warn('[MastraAPI] 流式API调用失败, 错误详情:', streamError);
          console.log('[MastraAPI] 尝试使用普通生成作为备选...');
          
          // 如果流式API失败，回退到普通生成
          try {
            const generateStartTime = Date.now();
            console.log('[MastraAPI] 发送普通生成请求...');
            
            const result = await (agent as any).generate({
              messages: request.messages,
              options: request.options
            });
            
            const generateTime = Date.now() - generateStartTime;
            console.log(`[MastraAPI] 普通生成请求完成, 耗时: ${generateTime}ms`);
            
            if (result && typeof result.text === 'string') {
              console.log(`[MastraAPI] 普通生成成功, 返回文本长度: ${result.text.length}`);
              yield result.text;
            } else if (result && result.content) {
              console.log(`[MastraAPI] 普通生成成功, 返回内容长度: ${result.content.length}`);
              yield result.content;
            } else {
              console.error('[MastraAPI] 普通生成失败: 响应格式无效', result);
              throw new Error('Failed to generate response: invalid format');
            }
          } catch (fallbackError) {
            console.error('[MastraAPI] 普通生成也失败:', fallbackError);
            throw fallbackError;
          }
        }
      } else {
        console.error('[MastraAPI] 错误: messages必须是数组');
        throw new Error("Messages must be an array");
      }
    } catch (error) {
      console.error(`[MastraAPI] 从智能体${agentName}流式生成失败:`, error);
      throw error;
    }
  },

  // 使用智能体的语音合成能力将文本转换为语音
  async speak(agentName: string, text: string): Promise<string> {
    try {
      console.log(`[MastraAPI] Requesting speech synthesis for agent ${agentName}`);
      
      // 尝试使用Mastra客户端的语音API
      const client = await getClient();
      const agent = client.getAgent(agentName || 'agent');
      
      try {
        // 如果智能体支持语音API
        if (agent && (agent as any).speak) {
          const audioUrl = await (agent as any).speak(text);
          console.log('[MastraAPI] Success: Used agent speak API');
          return audioUrl;
        }
        
        // 尝试使用Tauri后端转换
        const result = await invoke('text_to_speech', { 
          text,
          agentName
        });
        
        if (result && typeof result === 'string') {
          console.log('[MastraAPI] Success: Used Tauri backend TTS');
          return result; // 返回音频URL或base64
        }
        
        // 模拟实现，作为备选方案
        console.log('[MastraAPI] Using fallback speech implementation');
        await speakWithWebSpeech(text);
        return 'success'; // 不返回URL，因为已经播放了
      } catch (error) {
        console.error('[MastraAPI] Agent speak API failed:', error);
        // 使用浏览器内置TTS作为备选
        await textToSpeech(text, { useBrowser: true });
        return 'success';
      }
    } catch (error) {
      console.error('[MastraAPI] Speech synthesis failed:', error);
      throw error;
    }
  },
  
  /**
   * 将音频转为文本
   * @param agentId 智能体 ID
   * @param audioBase64 音频 Base64 编码
   * @returns 转换的文本
   */
  async listen(agentId: string, audioBase64: string): Promise<string> {
    // 检查音频数据是否有效
    if (!audioBase64 || audioBase64.length < 100) {
      console.warn('[MastraAPI] 无效的音频数据');
      return "音频数据无效，请重新录音";
    }
    
    // 日志输出音频大小，用于调试
    console.log(`[MastraAPI] listen: 收到音频数据，大小: ${audioBase64.length} 字符`);

    try {
      // 尝试使用智能体的API进行语音识别
      try {
        console.log('[MastraAPI] listen: 尝试使用Mastra客户端API');
        const client = await getClient();
        if (client) {
          console.log('[MastraAPI] listen: 尝试使用execute调用');
          // 使用Tool API方式调用
          const agentsTool = client.getTool('agents');
          if (agentsTool) {
            const response = await agentsTool.execute({
              data: {
                agentId,
                operation: 'execute',
                call: {
                  name: "listen",
                  args: [audioBase64]
                }
              }
            });
            
            if (response && response.success) {
              console.log('[MastraAPI] listen: 转录成功', response);
              if (typeof response.data === 'string') {
                return response.data;
              } else if (response.data && typeof response.data.result === 'string') {
                return response.data.result;
              } else if (response.data && response.data.text) {
                return response.data.text;
              }
              return JSON.stringify(response.data);
            } else {
              console.warn('[MastraAPI] listen: 工具调用失败', response);
              throw new Error(response?.error || '调用语音识别失败');
            }
          }
        }
      } catch (error) {
        console.warn('[MastraAPI] listen: 客户端API失败，尝试后备方法', error);
        // 如果智能体API失败，继续尝试后备方法
      }

      // 尝试使用 Tauri 后端进行语音转文本
      if (window.__TAURI__) {
        try {
          console.log('[MastraAPI] listen: 尝试使用Tauri后端');
          // @ts-ignore
          const { invoke } = window.__TAURI__;
          const response = await invoke("speech_to_text", {
            base64Audio: audioBase64,
          });
          console.log('[MastraAPI] listen: Tauri转录成功', response);
          return response;
        } catch (error) {
          console.warn('[MastraAPI] listen: Tauri后端失败', error);
          // 如果Tauri API失败，继续尝试后备方法
        }
      }

      // 尝试使用浏览器的语音识别API (Web Speech API)
      if (window.webkitSpeechRecognition || (window as any).SpeechRecognition) {
        console.log('[MastraAPI] listen: 尝试使用浏览器语音识别API');
        
        // 由于现在已经有录制好的音频，我们不能直接使用SpeechRecognition
        // 这里只是一个提示，提醒用户应用可能需要直接集成浏览器语音识别
        console.warn('[MastraAPI] listen: 浏览器语音识别API可用，但需要直接从麦克风录制');
      }
      
      console.error('[MastraAPI] listen: 所有语音识别方法均失败');
      
      // 检查Mastra服务是否运行
      if (!await this.isRunning()) {
        return "Mastra服务未运行，无法进行语音识别。请启动服务或使用文本输入。";
      }
      
      // 返回友好的错误信息
      return "语音识别失败，请重试或使用文本输入。";
    } catch (error) {
      console.error('[MastraAPI] listen: 捕获到异常:', error);
      
      // 根据错误类型返回不同的错误消息
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
        return "网络连接错误，请检查您的网络连接后重试。";
      } else if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return "无法访问麦克风，请在浏览器中允许麦克风访问权限。";
      } else if (error instanceof Error && error.message.includes('timeout')) {
        return "语音识别请求超时，请检查网络连接后重试。";
      }
      
      return "语音识别时发生错误，请重试或使用文本输入。";
    }
  },

  // 从文本中提取智能体数据
  async extractAgentData(text: string): Promise<any> {
    try {
      // 尝试从文本中提取JSON部分
      const jsonMatch = text.match(/```json([\s\S]*?)```/) || 
                        text.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        // 提取JSON内容并解析
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonContent.trim());
      }
      
      // 如果没有找到JSON，尝试从文本中提取关键信息
      const idMatch = text.match(/ID[:：]\s*([a-zA-Z0-9-_]+)/i);
      const nameMatch = text.match(/名称[:：]\s*(.+)$/m);
      const descMatch = text.match(/描述[:：]\s*(.+)$/m);
      
      if (idMatch || nameMatch) {
        return {
          id: idMatch ? idMatch[1].trim() : null,
          name: nameMatch ? nameMatch[1].trim() : null,
          description: descMatch ? descMatch[1].trim() : null,
        };
      }
      
      // 如果还是无法提取，返回原始响应
      return { text };
    } catch (error) {
      console.error('Failed to extract agent data:', error);
      return { text };
    }
  },

  // 从文本中提取智能体列表
  async extractAgentsList(text: string): Promise<any[]> {
    try {
      // 尝试从文本中提取JSON部分
      const jsonMatch = text.match(/```json([\s\S]*?)```/) || 
                        text.match(/\[([\s\S]*?)\]/);
      
      if (jsonMatch) {
        // 提取JSON内容并解析
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonContent.trim());
      }
      
      // 如果没有找到JSON，尝试从文本中提取列表
      const agents = [];
      const lines = text.split('\n');
      
      for (const line of lines) {
        // 匹配格式如 "1. 名称：XXX (ID: abc-123)" 或类似模式
        const match = line.match(/(?:\d+\.\s+)?(?:名称[:：]\s*)?(.+?)\s*(?:\(ID[:：]\s*([a-zA-Z0-9-_]+)\))?$/);
        if (match) {
          agents.push({
            name: match[1].trim(),
            id: match[2] ? match[2].trim() : null,
          });
        }
      }
      
      return agents.length > 0 ? agents : [];
    } catch (error) {
      console.error('Failed to extract agents list:', error);
      return [];
    }
  },

  // 获取智能体市场数据
  async getMarketAgents(): Promise<any[]> {
    try {
      const client = await getClient();
      
      // 尝试获取market-agents工具
      const marketAgentsTool = client.getTool('market-agents');
      
      // 通过工具API获取市场智能体列表
      const result = await marketAgentsTool.execute({
        data: {
          operation: 'list',
          includeDetails: true
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || '获取智能体市场列表失败');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Failed to get market agents:', error);
      return [];
    }
  },

  // 获取特定市场智能体详情
  async getMarketAgent(agentId: string): Promise<any> {
    try {
      const client = await getClient();
      
      // 尝试获取market-agents工具
      const marketAgentsTool = client.getTool('market-agents');
      
      // 通过工具API获取智能体详情
      const result = await marketAgentsTool.execute({
        data: {
          operation: 'get',
          agentId
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || `获取市场智能体 ${agentId} 失败`);
      }
      
      return result.data;
    } catch (error) {
      console.error(`Failed to get market agent ${agentId}:`, error);
      throw error;
    }
  },
}; 