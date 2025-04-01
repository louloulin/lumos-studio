import { OllamaEmbedding } from '@llamaindex/ollama';
import { OllamaProvider } from './ollama-provider';

type OllamaOptions = {
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
};

// 创建与 AI SDK 兼容的 Ollama 模型工厂函数
export function ollama(model: string, options: OllamaOptions = {}) {
  const provider = new OllamaProvider({
    model,
    baseUrl: options.baseUrl || 'http://localhost:11434',
    apiKey: options.apiKey,
    temperature: options.temperature,
    maxTokens: options.maxTokens
  });

  // 返回一个函数，该函数可以用作模型参数
  return {
    id: `ollama:${model}`,
    provider: 'ollama',
    
    // 用于获取嵌入向量
    async getEmbeddings(texts: string[]) {
      return provider.embedDocuments(texts);
    },

    // 用于生成文本
    async complete(messages: any[], options?: any) {
      const response = await provider.generate({
        messages,
        options
      });
      return response;
    },

    // 用于流式生成文本
    async completeStream(messages: any[], options?: any) {
      return provider.streamGenerate({
        messages,
        options
      });
    }
  };
}

// 获取可用模型列表
export async function listOllamaModels(baseUrl: string = 'http://localhost:11434'): Promise<string[]> {
  try {
    const provider = new OllamaProvider({
      model: 'unused',
      baseUrl
    });
    return await provider.listModels();
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    return [];
  }
} 