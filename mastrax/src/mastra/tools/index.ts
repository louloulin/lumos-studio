import { createTool, type Tool } from '@mastra/core/tools';
import { z } from 'zod';
import { eq, and, sql, type InferModel } from 'drizzle-orm';
import { db } from '../db';
import { agents, agentLogs } from '../db/schema';
import type { Agent, AgentLog } from '../db/schema';
import { ollamaHealthTool, ollamaModelsTool } from './ollama-tools';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}

interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

// 定义工具输入类型
const AgentInput = z.object({
  operation: z.enum(['get', 'getAll', 'create', 'update', 'delete']),
  agent: z.any().optional(),
  agentId: z.string().optional(),
}) as any;

// 定义工具输出类型
const AgentOutput = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
}) as any;

type AgentInputType = z.infer<typeof AgentInput>;
type AgentOutputType = z.infer<typeof AgentOutput>;

// 智能体存储工具
export const agentStorageTool = createTool({
  id: 'agent-storage',
  description: '管理本地智能体',
  inputSchema: AgentInput,
  outputSchema: AgentOutput,
  execute: async (context) => {
    const input = context as unknown as AgentInputType;
    try {
      switch (input.operation) {
        case 'get':
          return await getAgent(input.agentId!);
        case 'getAll':
          return await getAllAgents();
        case 'create':
          return await createAgent(input.agent);
        case 'update':
          return await updateAgent(input.agent);
        case 'delete':
          return await deleteAgent(input.agentId!);
        default:
          return {
            success: false,
            error: '不支持的操作',
          };
      }
    } catch (error) {
      console.error('智能体存储工具执行失败:', error);
      return {
        success: false,
        error: '智能体存储工具执行失败',
      };
    }
  },
}) as Tool;

// 获取单个智能体
const getAgent = async (agentId: string): Promise<AgentOutputType> => {
  try {
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    if (!agent) {
      return {
        success: false,
        error: '找不到指定的智能体',
      };
    }
    return {
      success: true,
      data: agent,
    };
  } catch (error) {
    console.error('获取智能体失败:', error);
    return {
      success: false,
      error: '获取智能体失败',
    };
  }
};

// 获取所有智能体
const getAllAgents = async (): Promise<AgentOutputType> => {
  try {
    const allAgents = await db.select().from(agents);
    return {
      success: true,
      data: allAgents,
    };
  } catch (error) {
    console.error('获取所有智能体失败:', error);
    return {
      success: false,
      error: '获取所有智能体失败',
    };
  }
};

// 创建智能体
const createAgent = async (agent: Partial<Agent>): Promise<AgentOutputType> => {
  if (!agent || !agent.name) {
    return {
      success: false,
      error: '缺少必要的智能体信息',
    };
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const newAgent = {
      id: agent.id || `agent-${now}-${Math.random().toString(36).substr(2, 9)}`,
      name: agent.name,
      description: agent.description ?? null,
      instructions: agent.instructions ?? null,
      model: agent.model ?? null,
      temperature: agent.temperature ?? null,
      maxTokens: agent.maxTokens ?? null,
      tools: agent.tools ?? null,
      systemAgent: agent.systemAgent ?? null,
      createdAt: now,
      updatedAt: now,
    } as Agent;

    await db.insert(agents).values(newAgent);
    
    return {
      success: true,
      data: newAgent,
    };
  } catch (error) {
    console.error('创建智能体失败:', error);
    return {
      success: false,
      error: '创建智能体失败',
    };
  }
};

// 更新智能体
const updateAgent = async (agent: Partial<Agent>): Promise<AgentOutputType> => {
  if (!agent || !agent.id) {
    return {
      success: false,
      error: '缺少必要的智能体信息或ID',
    };
  }

  try {
    const existingAgent = await getAgent(agent.id);
    if (!existingAgent.success || !existingAgent.data) {
      return existingAgent;
    }

    const now = Math.floor(Date.now() / 1000);
    const updatedAgent = {
      ...existingAgent.data,
      ...agent,
      tools: agent.tools ?? existingAgent.data.tools,
      updatedAt: now,
    } as Agent;

    await db.update(agents)
      .set(updatedAgent)
      .where(eq(agents.id, agent.id));

    return {
      success: true,
      data: updatedAgent,
    };
  } catch (error) {
    console.error('更新智能体失败:', error);
    return {
      success: false,
      error: '更新智能体失败',
    };
  }
};

// 删除智能体
const deleteAgent = async (agentId: string): Promise<AgentOutputType> => {
  try {
    const agent = await getAgent(agentId);
    if (!agent.success) {
      return agent;
    }

    await db.delete(agents).where(eq(agents.id, agentId));
    return {
      success: true,
      data: agent.data,
    };
  } catch (error) {
    console.error('删除智能体失败:', error);
    return {
      success: false,
      error: '删除智能体失败',
    };
  }
};

// 添加日志记录
const addAgentLog = async (log: Omit<AgentLog, 'id'>): Promise<boolean> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const newLog = {
      ...log,
      id: `log-${now}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
    } as AgentLog;

    await db.insert(agentLogs).values(newLog);
    return true;
  } catch (error) {
    console.error('添加日志记录失败:', error);
    return false;
  }
};

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

const getWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}

// 日志查询工具
export const agentLogsTool = createTool({
  id: 'agent-logs',
  description: '查询智能体操作日志',
  inputSchema: z.object({
    operation: z.enum(['getAll', 'getByAgent']),
    agentId: z.string().optional(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
  }) as any,
  outputSchema: z.object({
    success: z.boolean(),
    data: z.array(z.any()).optional(),
    error: z.string().optional(),
  }) as any,
  execute: async (context) => {
    try {
      const { operation, agentId, startTime, endTime } = context as any;
      
      const baseQuery = db.select().from(agentLogs);
      let finalQuery = baseQuery;
      
      if (startTime || endTime) {
        const conditions = [];
        if (startTime) {
          conditions.push(sql`${agentLogs.timestamp} >= ${startTime}`);
        }
        if (endTime) {
          conditions.push(sql`${agentLogs.timestamp} <= ${endTime}`);
        }
        if (conditions.length > 0) {
          finalQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
        }
      }
      
      switch (operation) {
        case 'getAll': {
          const allLogs = await finalQuery;
          return {
            success: true,
            data: allLogs.map((log) => ({
              ...log,
              details: typeof log.details === 'string' ? JSON.parse(log.details) : undefined,
            })),
          };
        }
        case 'getByAgent': {
          if (!agentId) {
            return {
              success: false,
              error: '缺少智能体ID',
            };
          }
          const query = finalQuery.where(eq(agentLogs.agentId, agentId)) as typeof baseQuery;
          const agentLogResults = await query;
          return {
            success: true,
            data: agentLogResults.map((log) => ({
              ...log,
              details: typeof log.details === 'string' ? JSON.parse(log.details) : undefined,
            })),
          };
        }
        default:
          return {
            success: false,
            error: `不支持的操作: ${operation}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `日志查询失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
}) as Tool;

// 导出 Ollama 工具
export { ollamaHealthTool, ollamaModelsTool };
