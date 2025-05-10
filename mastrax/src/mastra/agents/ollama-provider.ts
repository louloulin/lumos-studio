import { OllamaEmbedding } from '@llamaindex/ollama';

/**
 * Ollama模型提供者配置
 */
export interface OllamaProviderConfig {
  /** Ollama服务URL */
  baseUrl: string;
  /** 使用的模型名称 */
  model: string;
  /** 温度参数 */
  temperature?: number;
  /** 最大生成的token数 */
  maxTokens?: number;
  /** API密钥（若有） */
  apiKey?: string;
}

// 消息类型定义 - 简化版本
type Message = {
  role: string;
  content: string;
};

// 工具调用类型
type FunctionCall = {
  name: string;
  arguments: string;
};

/**
 * Ollama本地大语言模型提供者
 * 提供与Ollama API的集成，支持聊天完成和嵌入生成
 */
export class OllamaProvider {
  private baseUrl: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private apiKey?: string;

  constructor(config: OllamaProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama2';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2048;
    this.apiKey = config.apiKey;
  }

  /**
   * 将消息格式转换为Ollama API所需的格式
   */
  private convertMessages(messages: any[]): { role: string; content: string }[] {
    return messages.map((message) => {
      let role = 'user';
      
      if (message.role) {
        role = message.role;
      } else if (message.constructor && message.constructor.name) {
        if (message.constructor.name.includes('System')) {
          role = 'system';
        } else if (message.constructor.name.includes('AI')) {
          role = 'assistant';
        }
      }
      
      // 处理内容
      let content = '';
      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        content = message.content
          .filter((part: any) => typeof part === 'object' && part !== null && part.type === 'text')
          .map((part: any) => part.text)
          .join('\n');
      } else if (message.text) {
        content = message.text;
      }
      
      return { role, content };
    });
  }

  /**
   * 生成聊天完成
   */
  async generate({ messages, options }: any): Promise<any> {
    const convertedMessages = this.convertMessages(messages);

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: this.model,
        messages: convertedMessages,
        options: {
          temperature: options?.temperature ?? this.temperature,
          max_tokens: options?.maxTokens ?? this.maxTokens,
        },
        stream: false
      })
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // 解析工具调用（如果模型支持的话）
      const toolCalls: any[] = [];
      const content = data.message.content;
      
      // 尝试检测工具调用格式
      try {
        if (content.includes('```json') && content.includes('function_call')) {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            const toolCallData = JSON.parse(jsonMatch[1]);
            if (toolCallData.function_call) {
              toolCalls.push({
                type: 'function',
                id: `call_${Date.now()}`,
                function: {
                  name: toolCallData.function_call.name,
                  arguments: toolCallData.function_call.arguments
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse tool calls from Ollama response:', e);
      }
      
      // 创建AI消息
      return {
        message: {
          role: 'assistant',
          content: content,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined
        },
        usage: {
          promptTokens: 0, // Ollama通常不返回token使用信息
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      throw error;
    }
  }

  /**
   * 流式生成聊天完成
   */
  async *streamGenerate({ messages, options }: any): AsyncGenerator<any> {
    const convertedMessages = this.convertMessages(messages);

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: this.model,
        messages: convertedMessages,
        options: {
          temperature: options?.temperature ?? this.temperature,
          max_tokens: options?.maxTokens ?? this.maxTokens,
        },
        stream: true
      })
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API Error: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              if (line === '[DONE]') continue;
              
              const data = JSON.parse(line);
              if (data.message?.content) {
                accumulatedContent += data.message.content;
                yield { delta: data.message.content };
              }
            } catch (e) {
              console.warn('Error parsing stream chunk:', e);
            }
          }
        }
        
        // 最终消息
        yield {
          delta: '',
          message: {
            role: 'assistant',
            content: accumulatedContent
          },
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        };
        
      } catch (error) {
        reader.releaseLock();
        throw error;
      }
      
    } catch (error) {
      console.error('Error streaming from Ollama API:', error);
      throw error;
    }
  }

  /**
   * 生成文本嵌入
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      // 使用直接调用Ollama API的方式获取嵌入
      const embeddings: number[][] = [];
      
      for (const text of texts) {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: this.model,
            prompt: text
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get embeddings: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (result.embedding && Array.isArray(result.embedding)) {
          embeddings.push(result.embedding);
        } else {
          throw new Error('Invalid embedding response from Ollama');
        }
      }
      
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings with Ollama:', error);
      throw error;
    }
  }

  /**
   * 获取可用的Ollama模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list Ollama models: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((model: any) => model.name);
      }
      
      return [];
    } catch (error) {
      console.error('Error listing Ollama models:', error);
      return [];
    }
  }
} 