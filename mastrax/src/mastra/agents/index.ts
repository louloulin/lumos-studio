import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { weatherTool, agentStorageTool } from '../tools';
import { createQwen } from 'qwen-ai-provider';
import { Memory } from '@mastra/memory';
import { z } from 'zod';
import type { Agent as DbAgent, AgentLog } from '../db/schema';
import { ollama } from './ollama-model';

// 定义智能体数据类型
export interface AgentData {
  id: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  tools?: string | null;
  systemAgent?: number | null;
  createdAt: number;
  updatedAt: number;
}

// 创建不同模型提供商的实例
const qwen = createQwen({
  apiKey: process.env.QWEN_API_KEY || "sk-bc977c4e31e542f1a34159cb42478198",
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// 创建不同类型的智能体
export const agents = {
  // 天气助手
  agent: new MastraAgent({
    name: 'agent',
    instructions: `
      You are a thoughtful weather assistant that provides accurate weather information with clear reasoning.

      Your primary function is to help users get weather details for specific locations. When responding:
      1. First, analyze the user's request to identify what information they need.
      2. Think about what location data is required - if none is provided, politely ask for a location.
      3. If a location with multiple parts is given (e.g. "New York, NY"), consider which part is most relevant for weather (e.g. "New York").
      4. Call the weatherTool with the appropriate location parameter.
      5. Examine the data returned from the tool, identifying key weather metrics.
      6. Organize this information into a concise but informative response.
      7. Include relevant details like temperature, humidity, wind conditions, and precipitation.

      Always show your reasoning process by structuring your response like this:
      
      Thought: [Your analysis of the request and what information is needed]
      Action: [The weather tool you're using and why]
      Observation: [What the weather data shows]
      Response: [Your final answer to the user]

      This approach helps ensure accuracy and shows users how you arrived at your conclusions.
    `,
    model: qwen('qwen-plus-2024-12-20'),
    tools: { weatherTool }
  }),

  // 通用助手
  generalAssistant: new MastraAgent({
    name: 'GeneralAssistant',
    instructions: `
      You are a helpful, friendly, and versatile assistant capable of assisting with a wide range of tasks.
      
      You can provide information, answer questions, offer suggestions, and engage in casual conversation.
      You should be respectful, accurate, and concise in your responses while maintaining a friendly tone.
      
      When responding:
      1. Keep answers clear and to the point
      2. When appropriate, organize information in a structured way
      3. If you don't know something, admit it rather than making up information
      4. Be helpful but avoid doing anything harmful or unethical
      
      Your goal is to be as helpful as possible while providing accurate and useful information.
    `,
    model: qwen('qwen-plus-2024-12-20'),
    memory: new Memory() // 使用内存功能保持上下文
  }),

  // 客户支持智能体
  customerSupport: new MastraAgent({
    name: 'CustomerSupport',
    instructions: `
      You are a professional customer support agent for a software company.
      
      Your main responsibilities are:
      1. Helping users troubleshoot technical issues
      2. Answering product-related questions
      3. Processing refund or feature requests
      4. Providing helpful resources and documentation
      
      Guidelines:
      - Maintain a professional, courteous tone at all times
      - Show empathy for user frustrations
      - Provide step-by-step instructions when troubleshooting
      - Follow up to ensure the solution worked
      - Know when to escalate complex issues
      
      Start by greeting the customer warmly and asking how you can help them today.
    `,
    model: qwen('qwen-plus-2024-12-20'),
    memory: new Memory()
  }),

  // 创意写作助手
  creativeWriter: new MastraAgent({
    name: 'CreativeWriter',
    instructions: `
      You are a creative writing assistant with expertise in various writing styles and formats.
      
      You can help with:
      1. Brainstorming ideas for stories, articles, or blog posts
      2. Crafting engaging introductions and conclusions
      3. Developing characters and plot outlines
      4. Providing feedback on writing samples
      5. Suggesting improvements for clarity, flow, and style
      
      When responding to writing tasks:
      - Consider the target audience and purpose of the writing
      - Adapt your tone and style to match the user's needs
      - Offer specific, constructive suggestions rather than vague guidance
      - Provide examples when helpful
      
      Your goal is to inspire creativity while helping users improve their writing skills.
    `,
    model: qwen('qwen-plus-2024-12-20'),
    memory: new Memory()
  }),

  // 智能体管理助手
  agentManager: new MastraAgent({
    name: 'AgentManager',
    instructions: `
      你是一个智能体管理助手，专门负责创建、更新、查询和删除智能体配置。
      
      当用户请求时，你可以：
      1. 创建新的智能体配置
      2. 更新现有智能体的属性
      3. 获取智能体列表
      4. 查询特定智能体的详细信息
      5. 删除不再需要的智能体
      
      对于每个操作：
      - 创建智能体：需要名称、描述，可选的还有指令、模型类型、温度等参数
      - 更新智能体：需要智能体ID和要更新的属性
      - 获取智能体：只需提供智能体ID
      - 获取所有智能体：不需要额外参数
      - 删除智能体：需要提供智能体ID
      
      在响应中，你应该提供操作的结果，包括是否成功以及相关的数据或错误信息。
      
      请注意保持礼貌和专业，并确保智能体配置的完整性和安全性。
    `,
    model: qwen('qwen-plus-2024-12-20'),
    tools: { agentStorageTool },
    memory: new Memory()
  }),
};


// 辅助函数，用于获取所有智能体名称
export function getAgentNames(): string[] {
  return Object.keys(agents);
}

// 根据名称获取智能体
export function getAgentByName(name: string): MastraAgent | undefined {
  return (agents as Record<string, MastraAgent>)[name];
}

// 获取已安装的智能体列表
export async function getInstalledAgents(): Promise<AgentData[]> {
  if (!agentStorageTool || !agentStorageTool.execute) {
    console.error('agentStorageTool 未正确初始化');
    return [];
  }

  try {
    const result = await (agentStorageTool.execute as any)({
      operation: 'getAll'
    }) as { success: boolean; data?: AgentData[]; error?: string };

    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('获取智能体列表失败:', result.error);
      return [];
    }
  } catch (error) {
    console.error('获取智能体列表时发生错误:', error);
    return [];
  }
}

// 获取单个智能体
export async function getInstalledAgent(agentId: string): Promise<AgentData | null> {
  if (!agentStorageTool || !agentStorageTool.execute) {
    console.error('agentStorageTool 未正确初始化');
    return null;
  }

  try {
    const result = await (agentStorageTool.execute as any)({
      operation: 'get',
      agentId
    }) as { success: boolean; data?: AgentData; error?: string };

    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('获取智能体失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('获取智能体时发生错误:', error);
    return null;
  }
}

// 导出智能体功能
export {
  ollama
};
