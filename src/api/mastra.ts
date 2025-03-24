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

  // Check if the Mastra service is running
  async isRunning(): Promise<boolean> {
    try {
      const client = await getClient();
      // Try to get agents as a way to check if the service is running
      await client.getAgents();
      return true;
    } catch (error) {
      console.error('Mastra service health check failed:', error);
      return false;
    }
  },
}; 