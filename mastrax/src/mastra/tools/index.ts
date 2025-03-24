import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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

// 定义智能体存储所需的类型
export interface AgentData {
  id: string;
  name: string;
  description: string;
  instructions?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AgentTool[];
  systemAgent?: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  enabled?: boolean;
  parameters?: ToolParameter[];
}

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

// 获取数据库路径
const getDbPath = async () => {
  // 使用项目根目录的memory.db作为数据库文件
  // 在生产模式中，这个文件会被打包到应用资源目录
  const currentFilePath = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(currentFilePath), '../../../');
  return path.join(projectRoot, 'memory.db');
};

// 智能体存储工具 - 提供CRUD操作
export const agentStorageTool = createTool({
  id: 'agent-storage',
  description: '持久化存储智能体信息',
  inputSchema: z.object({
    operation: z.enum(['get', 'getAll', 'create', 'update', 'delete']),
    agent: z.any().optional(),
    agentId: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    try {
      const { operation, agent, agentId } = context;
      
      switch (operation) {
        case 'get':
          return await getAgent(agentId);
        case 'getAll':
          return await getAllAgents();
        case 'create':
          return await createAgent(agent);
        case 'update':
          return await updateAgent(agent);
        case 'delete':
          return await deleteAgent(agentId);
        default:
          return {
            success: false,
            error: `不支持的操作: ${operation}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `存储操作失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// 读取JSON数据文件
const readAgentData = async (): Promise<AgentData[]> => {
  try {
    const dbPath = await getDbPath();
    const dbDir = path.dirname(dbPath);
    
    // 确保数据目录存在
    await fs.mkdir(dbDir, { recursive: true });
    
    // JSON文件路径 - 使用与memory.db相同的目录
    const dataPath = path.join(path.dirname(dbPath), 'agents.json');
    
    try {
      const data = await fs.readFile(dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // 文件不存在或格式错误，创建空文件并返回空数组
      await fs.writeFile(dataPath, JSON.stringify([], null, 2), 'utf-8');
      console.log(`已创建新的智能体存储文件: ${dataPath}`);
      return [];
    }
  } catch (error) {
    console.error('读取智能体数据失败:', error);
    return [];
  }
};

// 写入JSON数据文件
const writeAgentData = async (agents: AgentData[]): Promise<boolean> => {
  try {
    const dbPath = await getDbPath();
    
    // JSON文件路径 - 使用与memory.db相同的目录
    const dataPath = path.join(path.dirname(dbPath), 'agents.json');
    
    await fs.writeFile(dataPath, JSON.stringify(agents, null, 2), 'utf-8');
    console.log(`智能体数据已保存至: ${dataPath}`);
    return true;
  } catch (error) {
    console.error('写入智能体数据失败:', error);
    return false;
  }
};

// 获取单个智能体
const getAgent = async (agentId?: string): Promise<{ success: boolean; data?: AgentData; error?: string }> => {
  if (!agentId) {
    return {
      success: false,
      error: '缺少智能体ID',
    };
  }

  const agents = await readAgentData();
  const agent = agents.find(a => a.id === agentId);

  if (!agent) {
    return {
      success: false,
      error: `未找到ID为 ${agentId} 的智能体`,
    };
  }

  return {
    success: true,
    data: agent,
  };
};

// 获取所有智能体
const getAllAgents = async (): Promise<{ success: boolean; data: AgentData[]; error?: string }> => {
  const agents = await readAgentData();
  return {
    success: true,
    data: agents,
  };
};

// 创建智能体
const createAgent = async (agent?: any): Promise<{ success: boolean; data?: AgentData; error?: string }> => {
  if (!agent || !agent.name) {
    return {
      success: false,
      error: '缺少必要的智能体信息',
    };
  }

  const agents = await readAgentData();
  
  // 生成唯一ID
  const newAgent: AgentData = {
    ...agent,
    id: agent.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 添加到数组
  agents.push(newAgent);
  
  // 写入文件
  const success = await writeAgentData(agents);
  if (!success) {
    return {
      success: false,
      error: '保存智能体数据失败',
    };
  }

  return {
    success: true,
    data: newAgent,
  };
};

// 更新智能体
const updateAgent = async (agent?: any): Promise<{ success: boolean; data?: AgentData; error?: string }> => {
  if (!agent || !agent.id) {
    return {
      success: false,
      error: '缺少必要的智能体信息或ID',
    };
  }

  const agents = await readAgentData();
  const index = agents.findIndex(a => a.id === agent.id);

  if (index === -1) {
    return {
      success: false,
      error: `未找到ID为 ${agent.id} 的智能体`,
    };
  }

  // 更新智能体
  const updatedAgent: AgentData = {
    ...agents[index],
    ...agent,
    updatedAt: Date.now(),
  };
  
  agents[index] = updatedAgent;
  
  // 写入文件
  const success = await writeAgentData(agents);
  if (!success) {
    return {
      success: false,
      error: '更新智能体数据失败',
    };
  }

  return {
    success: true,
    data: updatedAgent,
  };
};

// 删除智能体
const deleteAgent = async (agentId?: string): Promise<{ success: boolean; error?: string }> => {
  if (!agentId) {
    return {
      success: false,
      error: '缺少智能体ID',
    };
  }

  const agents = await readAgentData();
  const filteredAgents = agents.filter(a => a.id !== agentId);
  
  if (filteredAgents.length === agents.length) {
    return {
      success: false,
      error: `未找到ID为 ${agentId} 的智能体`,
    };
  }
  
  // 写入文件
  const success = await writeAgentData(filteredAgents);
  if (!success) {
    return {
      success: false,
      error: '删除智能体数据失败',
    };
  }

  return {
    success: true,
  };
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
