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

// Get the Mastra service URL from the Tauri backend
async function getMastraUrl(): Promise<string> {
  try {
    // 添加重试机制
    let retries = 0;
    const maxRetries = 3;
    let lastError: any = null;
    
    // 先检查Tauri API是否已加载
    await loadTauriAPI().catch(() => {});

    // 默认端口，如果所有尝试都失败
    const DEFAULT_PORT = 4112;
    
    while (retries < maxRetries) {
      try {
        // 先检查 invoke 是否已准备好
        if (typeof invoke !== 'function') {
          throw new Error('Tauri invoke function not initialized yet');
        }
        
        // 使用Promise包装invoke调用，设置超时
        const invokeWithTimeout = (fn: any, ...args: any[]) => {
          return Promise.race([
            fn(...args),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Invoke timeout')), 2000);
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
    return 'http://localhost:4112'; // 修改默认端口为4112
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
        operation: 'create',
        agent: agentParams
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
        operation: 'update',
        agent: { id: agentId, ...agentParams }
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
        operation: 'delete',
        agentId
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
        operation: 'getAll'
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
        operation: 'get',
        agentId
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
      // 添加重试机制
      let retries = 0;
      const maxRetries = 2;
      let lastError: any = null;
      
      while (retries <= maxRetries) {
        try {
          const client = await getClient();
          // 简单调用获取智能体列表API判断服务是否可用
          await client.getAgents();
          console.log('Successfully connected to Mastra service');
          return true;
        } catch (error) {
          lastError = error;
          console.warn(`Failed to connect to Mastra service (attempt ${retries + 1}/${maxRetries + 1}):`, error);
          retries++;
          
          // 最后一次尝试前等待一小段时间
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }
      
      // 如果所有尝试都失败
      console.error('All attempts to connect to Mastra service failed:', lastError);
      return false;
    } catch (error) {
      console.error('Mastra service check failed:', error);
      return false;
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
      console.log('streamGenerate called for agent:', agentName);
      const client = await getClient();
      const agent = client.getAgent(agentName || 'agent');
      
      if (Array.isArray(request.messages)) {
        if (request.messages.length === 0) {
          throw new Error("Messages array cannot be empty");
        }
        
        try {
          // 使用stream方法获取Response对象
          console.log('Calling stream with messages:', request.messages);
          const response = await (agent as any).stream({
            messages: request.messages,
            options: request.options
          });
          
          if (response && response.body) {
            console.log('Stream response received, processing with reader');
            // 获取reader
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';
            
            // 读取流数据
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // 解码二进制数据为文本
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // 处理buffer中的数据
              let lines = buffer.split('\n');
              buffer = lines.pop() || ''; // 保留最后一个可能不完整的行
              
              for (const line of lines) {
                if (!line.trim()) continue; // 跳过空行
                
                try {
                  // 检查是否是JSON格式的元数据
                  if (line.startsWith('f:') || line.startsWith('d:') || line.startsWith('e:')) {
                    // 这是完成或其他元数据，可以记录但不输出给用户
                    console.log('Metadata:', line);
                    continue;
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
                  
                  // 如果没有特定格式，原样输出
                  console.log('Unknown format line:', line);
                  yield line;
                } catch (parseError) {
                  console.warn('Error parsing line:', parseError, line);
                  yield line; // 出错时原样返回
                }
              }
            }
            
            // 处理剩余的buffer
            if (buffer.trim()) {
              console.log('Processing remaining buffer:', buffer);
              yield buffer;
            }
            
          } else {
            throw new Error('Stream response or body is null');
          }
        } catch (streamError) {
          console.warn('Stream API failed, falling back to normal generate:', streamError);
          // 如果流式API失败，回退到普通生成
          const result = await (agent as any).generate({
            messages: request.messages,
            options: request.options
          });
          
          yield typeof result.text === 'string' ? result.text : '';
        }
      } else {
        throw new Error("Messages must be an array");
      }
    } catch (error) {
      console.error(`Failed to stream from agent ${agentName}:`, error);
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
  
  // 使用智能体的语音识别能力将音频转换为文本
  async listen(agentName: string, audioBase64: string): Promise<string> {
    try {
      console.log(`[MastraAPI] Requesting speech recognition for agent ${agentName}`);
      
      // 尝试使用Mastra客户端的语音API
      const client = await getClient();
      const agent = client.getAgent(agentName || 'agent');
      
      try {
        // 如果智能体支持语音识别API
        if (agent && (agent as any).listen) {
          const transcript = await (agent as any).listen({
            audio: audioBase64,
            options: {
              language: 'zh-CN'
            }
          });
          console.log('[MastraAPI] Success: Used agent listen API');
          return transcript;
        }
        
        // 尝试使用Tauri后端转换
        const result = await invoke('speech_to_text', { 
          audio: audioBase64,
          agentName
        });
        
        if (result && typeof result === 'string') {
          console.log('[MastraAPI] Success: Used Tauri backend STT');
          return result;
        }
        
        // 返回模拟结果
        console.log('[MastraAPI] Using mock transcription result');
        return "这是通过Mastra语音服务转录的文本。在实际项目中，这里应该从Mastra语音API获取真实的转录结果。";
      } catch (error) {
        console.error('[MastraAPI] Agent listen API failed:', error);
        // 返回模拟结果
        return "语音识别失败，请重试或使用文本输入。";
      }
    } catch (error) {
      console.error('[MastraAPI] Speech recognition failed:', error);
      throw error;
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