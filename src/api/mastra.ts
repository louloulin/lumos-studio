// Import Tauri API with a dynamic require to avoid TypeScript errors
let invoke: any;
try {
  // Use dynamic import approach
  const tauri = require('@tauri-apps/api/tauri');
  invoke = tauri.invoke;
} catch (e) {
  // Fallback for when the module isn't available (e.g., in a development environment)
  console.warn('Tauri API not available, using mock implementation');
  invoke = async () => 'http://localhost:4111';
}

import { MastraClient } from '@mastra/client-js';
import { MastraMessage, AgentGenerateRequest, AgentGenerateResponse } from './types';

// 添加导入
import { textToSpeech, speakWithWebSpeech } from './speech';

// Get the Mastra service URL from the Tauri backend
async function getMastraUrl(): Promise<string> {
  try {
    return await invoke('get_mastra_url');
  } catch (error) {
    console.error('Failed to get Mastra service URL:', error);
    return 'http://localhost:4112'; // 修改默认端口为4112
  }
}

// Initialize Mastra client instance
let mastraClient: MastraClient | null = null;

async function getClient() {
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
  // Get available agents
  async getAgents(): Promise<string[]> {
    try {
      const client = await getClient();
      const agents = await client.getAgents();
      return Array.isArray(agents) ? agents.map(agent => agent.name) : [];
    } catch (error) {
      console.error('Failed to get agents:', error);
      return [];
    }
  },

  // 检查Mastra服务是否运行
  async isRunning(): Promise<boolean> {
    try {
      const client = await getClient();
      // 简单调用获取智能体列表API判断服务是否可用
      await client.getAgents();
      return true;
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
  }
}; 