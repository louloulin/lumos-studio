import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { listOllamaModels } from '../agents/ollama-model';

/**
 * Ollama模型工具 - 提供查询可用的Ollama模型的能力
 */
export const ollamaModelsTool = createTool({
  id: 'ollama-models',
  description: '获取可用的Ollama本地模型列表',
  inputSchema: z.object({
    baseUrl: z.string().optional().describe('Ollama服务的URL，默认为http://localhost:11434'),
  }),
  execute: async ({ context }) => {
    try {
      const models = await listOllamaModels(context?.baseUrl || 'http://localhost:11434');
      return {
        success: true,
        data: models
      };
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return {
        success: false,
        error: `获取Ollama模型列表失败: ${error}`
      };
    }
  }
});

/**
 * Ollama健康检查工具 - 检查Ollama服务是否正常运行
 */
export const ollamaHealthTool = createTool({
  id: 'ollama-health',
  description: '检查Ollama服务的健康状态',
  inputSchema: z.object({
    baseUrl: z.string().optional().describe('Ollama服务的URL，默认为http://localhost:11434'),
  }),
  execute: async ({ context }) => {
    const url = context?.baseUrl || 'http://localhost:11434';
    try {
      const response = await fetch(`${url}/api/version`);
      
      if (!response.ok) {
        return {
          success: false,
          error: `Ollama服务检查失败: ${response.statusText}`,
          status: response.status
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: {
          status: 'healthy',
          version: data.version,
          url
        }
      };
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return {
        success: false,
        error: `Ollama服务不可用: ${error}`,
        status: 'error'
      };
    }
  }
}); 