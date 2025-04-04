import { createTool, type Tool } from '@mastra/core/tools';
import { z } from 'zod';
import { eq, and, sql, type InferModel } from 'drizzle-orm';
import { db } from '../db';
import { agents, agentLogs } from '../db/schema';
import type { Agent, AgentLog } from '../db/schema';
import { logger } from '../logging';
import { debugTool } from './debug-tool';

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

// 智能体基本信息模式
const AgentBaseSchema = z.object({
  name: z.string().min(1, '智能体名称不能为空'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().int().optional(),
  tools: z.array(z.string()).or(z.string()).optional(),
  systemAgent: z.boolean().optional(),
  type: z.string().optional(),
  categories: z.array(z.string()).optional(),
  version: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  avatar: z.string().optional(),
});

// 定义不同操作的输入类型
const GetAgentSchema = z.object({
  operation: z.literal('get'),
  agentId: z.string().min(1, '智能体ID不能为空'),
});

const GetAllAgentsSchema = z.object({
  operation: z.literal('getAll'),
});

const CreateAgentSchema = z.object({
  operation: z.literal('create'),
  agent: AgentBaseSchema.extend({
    id: z.string().optional(),
  }),
});

const UpdateAgentSchema = z.object({
  operation: z.literal('update'),
  agent: AgentBaseSchema.extend({
    id: z.string().min(1, '智能体ID不能为空'),
  }),
});

const DeleteAgentSchema = z.object({
  operation: z.literal('delete'),
  agentId: z.string().min(1, '智能体ID不能为空'),
});

// 使用判别联合组合所有操作
const AgentOperationSchema = z.discriminatedUnion('operation', [
  GetAgentSchema,
  GetAllAgentsSchema,
  CreateAgentSchema,
  UpdateAgentSchema,
  DeleteAgentSchema,
]);

// 同时支持直接操作和data包装的操作
const AgentInput = z.union([
  z.object({ data: AgentOperationSchema }),  // 包装在data对象中的请求
  AgentOperationSchema                       // 直接的操作请求
]);

// 定义工具输出类型
const AgentOutput = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

type AgentInputType = z.infer<typeof AgentInput>;
type AgentOperationType = z.infer<typeof AgentOperationSchema>;
type AgentOutputType = z.infer<typeof AgentOutput>;

// 智能体存储工具
export const agentStorageTool = createTool({
  id: 'agent-storage',
  description: '管理本地智能体',
  inputSchema: AgentInput,
  outputSchema: AgentOutput,
  execute: async (context) => {
    const startTime = Date.now();
    const toolId = 'agent-storage';
    
    try {
      // 记录请求 - 添加更多详细信息
      logger.tool.info(toolId, '开始执行智能体存储工具', { context });
      logger.tool.request(toolId, context);
      
      // 使用any类型断言避免TypeScript错误
      const anyContext = context as any;
      
      // 打印完整请求结构以便调试
      logger.tool.debug(toolId, '完整请求对象', { 
        contextType: typeof anyContext,
        hasContext: anyContext.context !== undefined,
        hasData: anyContext.data !== undefined,
        hasOperation: anyContext.operation !== undefined,
        keys: Object.keys(anyContext)
      });
      
      // 准备操作参数
      let operationParams: any;
      
      // 检查各种可能的请求格式
      if (anyContext.data && anyContext.data.operation) {
        // 1. 包装在data中的请求 - 标准格式
        logger.tool.debug(toolId, '使用data包装的请求格式', anyContext.data);
        operationParams = anyContext.data;
      } else if (anyContext.operation) {
        // 2. 直接的操作请求 - 无data包装
        logger.tool.debug(toolId, '使用直接操作的请求格式', anyContext);
        operationParams = anyContext;
      } else if (anyContext.context && anyContext.context.operation) {
        // 3. context嵌套的操作请求 - 可能来自某些客户端
        logger.tool.debug(toolId, '使用context嵌套的请求格式', anyContext.context);
        operationParams = anyContext.context;
      } else {
        // 检查是否有任何字段包含operation
        let foundParams = null;
        for (const key of Object.keys(anyContext)) {
          const value = anyContext[key];
          if (value && typeof value === 'object' && value.operation) {
            logger.tool.debug(toolId, `在字段${key}中找到operation`, value);
            foundParams = value;
            break;
          }
        }
        
        if (foundParams) {
          // 找到了嵌套在某个字段中的操作参数
          operationParams = foundParams;
        } else {
          // 未找到有效的操作
          const error = {
            success: false,
            error: '缺少必要的操作参数，请提供operation字段',
          };
          logger.tool.error(toolId, '无效的请求格式', { 
            error, 
            context,
            availableKeys: Object.keys(anyContext)
          });
          logger.tool.response(toolId, error, Date.now() - startTime);
          return error;
        }
      }
      
      // 实际处理操作
      return await processAgentOperation(operationParams, startTime, toolId);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      const result = {
        success: false,
        error: `智能体存储工具执行失败: ${errorMessage}`,
      };
      
      logger.tool.error(toolId, '智能体存储工具执行失败', { 
        error: errorMessage, 
        stack: errorStack,
        duration
      });
      logger.tool.response(toolId, result, duration);
      
      return result;
    }
  },
}) as any;

// 处理智能体操作
async function processAgentOperation(input: any, startTime: number, toolId: string) {
  logger.tool.debug(toolId, `执行操作: ${input.operation}`, input);
  
  let result;
  switch (input.operation) {
    case 'get':
      logger.tool.debug(toolId, `获取智能体: ${input.agentId}`);
      result = await getAgent(input.agentId);
      break;
    case 'getAll':
      logger.tool.debug(toolId, '获取所有智能体');
      result = await getAllAgents();
      break;
    case 'create':
      logger.tool.debug(toolId, '创建智能体', { agent: input.agent });
      result = await createAgent(input.agent);
      break;
    case 'update':
      logger.tool.debug(toolId, `更新智能体: ${input.agent.id}`, { agent: input.agent });
      result = await updateAgent(input.agent);
      break;
    case 'delete':
      logger.tool.debug(toolId, `删除智能体: ${input.agentId}`);
      result = await deleteAgent(input.agentId);
      break;
    default:
      result = {
        success: false,
        error: `不支持的操作: ${input.operation}`,
      };
      logger.tool.error(toolId, `不支持的操作: ${input.operation}`);
  }
  
  // 记录响应
  const duration = Date.now() - startTime;
  logger.tool.response(toolId, result, duration);
  
  if (!result.success) {
    logger.tool.error(toolId, `操作失败: ${result.error}`, { input, result });
  } else {
    logger.tool.info(toolId, `操作成功: ${input.operation}`, { 
      duration, 
      dataSize: result.data ? JSON.stringify(result.data).length : 0 
    });
  }
  
  return result;
}

// 获取单个智能体
const getAgent = async (agentId: string): Promise<AgentOutputType> => {
  const toolId = 'agent-storage';
  const startTime = Date.now();
  
  try {
    logger.tool.debug(toolId, `开始查询智能体: ${agentId}`);
    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    
    if (!agent) {
      const result = {
        success: false,
        error: `找不到指定的智能体: ${agentId}`,
      };
      logger.tool.warn(toolId, result.error);
      return result;
    }
    
    logger.tool.debug(toolId, `成功获取智能体: ${agentId}`, { 
      duration: Date.now() - startTime 
    });
    
    return {
      success: true,
      data: agent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, `获取智能体失败: ${agentId}`, { 
      error: errorMessage,
      duration: Date.now() - startTime 
    });
    
    return {
      success: false,
      error: `获取智能体失败: ${errorMessage}`,
    };
  }
};

// 获取所有智能体
const getAllAgents = async (): Promise<AgentOutputType> => {
  const toolId = 'agent-storage';
  const startTime = Date.now();
  
  try {
    logger.tool.debug(toolId, '开始获取所有智能体');
    const allAgents = await db.select().from(agents);
    
    logger.tool.debug(toolId, `成功获取所有智能体，共 ${allAgents.length} 个`, { 
      duration: Date.now() - startTime 
    });
    
    return {
      success: true,
      data: allAgents,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, '获取所有智能体失败', { 
      error: errorMessage,
      duration: Date.now() - startTime 
    });
    
    return {
      success: false,
      error: `获取所有智能体失败: ${errorMessage}`,
    };
  }
};

// 创建智能体
const createAgent = async (agent: Partial<Agent>): Promise<AgentOutputType> => {
  const toolId = 'agent-storage';
  const startTime = Date.now();
  
  if (!agent || !agent.name) {
    const error = '缺少必要的智能体信息';
    logger.tool.warn(toolId, error, { agent });
    return {
      success: false,
      error,
    };
  }

  try {
    logger.tool.debug(toolId, '开始创建智能体', { agentName: agent.name });
    
    const now = Math.floor(Date.now() / 1000);
    const agentId = agent.id || `agent-${Date.now()}`;
    const newAgent = {
      id: agentId,
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

    logger.tool.debug(toolId, `准备插入智能体: ${agentId}`, { newAgent });
    await db.insert(agents).values(newAgent);
    
    logger.tool.info(toolId, `成功创建智能体: ${agentId}`, { 
      duration: Date.now() - startTime,
      agent: newAgent
    });
    
    return {
      success: true,
      data: newAgent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, '创建智能体失败', { 
      error: errorMessage, 
      agent,
      duration: Date.now() - startTime 
    });
    
    return {
      success: false,
      error: `创建智能体失败: ${errorMessage}`,
    };
  }
};

// 更新智能体
const updateAgent = async (agent: Partial<Agent>): Promise<AgentOutputType> => {
  const toolId = 'agent-storage';
  const startTime = Date.now();
  
  if (!agent || !agent.id) {
    const error = '缺少必要的智能体信息或ID';
    logger.tool.warn(toolId, error, { agent });
    return {
      success: false,
      error,
    };
  }

  try {
    logger.tool.debug(toolId, `开始更新智能体: ${agent.id}`);
    
    const existingAgent = await getAgent(agent.id);
    if (!existingAgent.success || !existingAgent.data) {
      logger.tool.warn(toolId, `更新失败，智能体不存在: ${agent.id}`);
      return existingAgent;
    }

    const now = Math.floor(Date.now() / 1000);
    const updatedAgent = {
      ...existingAgent.data,
      ...agent,
      tools: agent.tools ?? existingAgent.data.tools,
      updatedAt: now,
    } as Agent;

    logger.tool.debug(toolId, `准备更新智能体: ${agent.id}`, { 
      before: existingAgent.data,
      after: updatedAgent
    });
    
    await db.update(agents)
      .set(updatedAgent)
      .where(eq(agents.id, agent.id));

    logger.tool.info(toolId, `成功更新智能体: ${agent.id}`, { 
      duration: Date.now() - startTime
    });
    
    return {
      success: true,
      data: updatedAgent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, `更新智能体失败: ${agent.id}`, { 
      error: errorMessage,
      agent,
      duration: Date.now() - startTime 
    });
    
    return {
      success: false,
      error: `更新智能体失败: ${errorMessage}`,
    };
  }
};

// 删除智能体
const deleteAgent = async (agentId: string): Promise<AgentOutputType> => {
  const toolId = 'agent-storage';
  const startTime = Date.now();
  
  if (!agentId) {
    const error = '缺少智能体ID';
    logger.tool.warn(toolId, error);
    return {
      success: false,
      error,
    };
  }

  try {
    logger.tool.debug(toolId, `开始删除智能体: ${agentId}`);
    
    // 先检查智能体是否存在
    const existingAgent = await getAgent(agentId);
    if (!existingAgent.success) {
      logger.tool.warn(toolId, `删除失败，智能体不存在: ${agentId}`);
      return existingAgent;
    }

    logger.tool.debug(toolId, `智能体存在，准备删除: ${agentId}`, { 
      agent: existingAgent.data
    });
    
    await db.delete(agents).where(eq(agents.id, agentId));

    logger.tool.info(toolId, `成功删除智能体: ${agentId}`, { 
      duration: Date.now() - startTime
    });
    
    return {
      success: true,
      data: { id: agentId, deleted: true },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, `删除智能体失败: ${agentId}`, { 
      error: errorMessage,
      duration: Date.now() - startTime 
    });
    
    return {
      success: false,
      error: `删除智能体失败: ${errorMessage}`,
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

// 重新导出debugTool
export { debugTool };
