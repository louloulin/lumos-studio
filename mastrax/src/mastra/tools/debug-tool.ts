import { createTool, type Tool } from '@mastra/core/tools';
import { z } from 'zod';
import { eq, and, sql, type InferModel } from 'drizzle-orm';
import { db } from '../db';
import { agents, agentLogs } from '../db/schema';
import { logger } from '../logging';
import * as fs from 'fs';
import * as path from 'path';

// 定义调试工具的输入类型
const DebugToolInput = z.object({
  data: z.object({
    action: z.enum(['info', 'test-api', 'get-logs', 'inspect-request', 'health-check', 'inspect-api-format']),
    params: z.any().optional(),
  }),
});

// 定义调试工具的输出类型
const DebugToolOutput = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  logs: z.array(z.any()).optional(),
});

// 调试工具
export const debugTool = createTool({
  id: 'debug-tool',
  description: '提供系统调试和信息查询功能',
  inputSchema: DebugToolInput,
  outputSchema: DebugToolOutput,
  execute: async (context) => {
    const startTime = Date.now();
    const toolId = 'debug-tool';
    
    try {
      // 记录原始请求内容，方便调试工具API格式问题
      console.log('====== 调试工具收到请求 ======');
      console.log('原始请求对象:', JSON.stringify(context, null, 2));
      console.log('请求类型:', typeof context);
      console.log('请求属性:', Object.keys(context));
      console.log('===============================');
      
      // 使用类型断言处理context对象
      const typedContext = context as any;
      
      // 尝试检测请求格式问题
      if (!typedContext.data && typedContext.action) {
        console.log('检测到可能的格式问题: context直接包含action而不是data.action');
        // 自动修正格式
        typedContext.data = {
          action: typedContext.action,
          params: typedContext.params || {}
        };
        console.log('自动修正后的请求:', JSON.stringify(typedContext, null, 2));
      }
      
      if (!typedContext.data || !typedContext.data.action) {
        logger.tool.error(toolId, '缺少必要的data.action参数');
        return {
          success: false,
          error: '缺少必要的action参数',
          debug_info: {
            original_request: context,
            detected_format: typeof context === 'object' ? '对象' : typeof context,
            has_data: typedContext.data ? true : false,
          }
        };
      }
      
      const { action, params } = typedContext.data;
      logger.tool.debug(toolId, `执行操作: ${action}`, { params });
      
      switch (action) {
        case 'info':
          return getSystemInfo();
        case 'test-api':
          return testApi(params);
        case 'get-logs':
          return getLogs(params);
        case 'inspect-request':
          return inspectRequest(params, typedContext);
        case 'health-check':
          return healthCheck();
        case 'inspect-api-format':
          return inspectApiFormat(context);
        default:
          return {
            success: false,
            error: `不支持的操作: ${action}`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.tool.error(toolId, '调试工具执行失败', { error: errorMessage });
      
      return {
        success: false,
        error: `调试工具执行失败: ${errorMessage}`,
        debug_info: {
          error_type: error instanceof Error ? error.constructor.name : typeof error,
          error_stack: error instanceof Error ? error.stack : undefined
        }
      };
    }
  },
}) as Tool;

// 新功能：检查API格式，分析传入的参数结构
const inspectApiFormat = async (originalContext: any) => {
  const toolId = 'debug-tool';
  
  try {
    // 收集各种可能的请求格式信息
    const formatInfo = {
      original_type: typeof originalContext,
      is_object: typeof originalContext === 'object',
      top_level_keys: typeof originalContext === 'object' ? Object.keys(originalContext) : [],
      has_data: originalContext && typeof originalContext === 'object' && 'data' in originalContext,
      data_type: originalContext && typeof originalContext === 'object' && 'data' in originalContext ? 
                 typeof originalContext.data : 'undefined',
      has_operation: originalContext && typeof originalContext === 'object' && 'operation' in originalContext,
      suggested_format: null as any,
      agent_storage_expected_format: {
        data: {
          operation: "create/update/delete/get/getAll",
          agent: {}, // 对于create/update操作
          agentId: "agent-id" // 对于get/delete操作
        }
      },
      detected_problems: [] as string[],
    };
    
    // 检测常见问题
    if (!formatInfo.is_object) {
      formatInfo.detected_problems.push("请求不是对象类型");
    }
    
    if (!formatInfo.has_data) {
      formatInfo.detected_problems.push("请求中缺少data对象");
      
      // 尝试推断正确的格式
      if (formatInfo.has_operation) {
        formatInfo.suggested_format = {
          data: {
            operation: originalContext.operation,
          }
        };
        
        if ('agent' in originalContext) {
          formatInfo.suggested_format.data.agent = originalContext.agent;
        }
        
        if ('agentId' in originalContext) {
          formatInfo.suggested_format.data.agentId = originalContext.agentId;
        }
        
        formatInfo.detected_problems.push("检测到顶层包含operation，建议使用data包装");
      }
    } else if (formatInfo.has_data && originalContext.data && typeof originalContext.data === 'object') {
      // 检查data对象格式
      if (!('operation' in originalContext.data)) {
        formatInfo.detected_problems.push("data对象中缺少operation字段");
      }
      
      const op = originalContext.data.operation;
      if (op === 'create' || op === 'update') {
        if (!('agent' in originalContext.data)) {
          formatInfo.detected_problems.push(`${op}操作需要提供agent对象`);
        }
      } else if (op === 'get' || op === 'delete') {
        if (!('agentId' in originalContext.data)) {
          formatInfo.detected_problems.push(`${op}操作需要提供agentId`);
        }
      }
    }
    
    logger.tool.info(toolId, '完成API格式检查', formatInfo);
    
    return {
      success: true,
      data: formatInfo,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, 'API格式检查失败', { error: errorMessage });
    
    return {
      success: false,
      error: `API格式检查失败: ${errorMessage}`,
    };
  }
};

// 获取系统信息
const getSystemInfo = async () => {
  const toolId = 'debug-tool';
  const startTime = Date.now();
  
  try {
    const agentCount = await db.select({ count: sql`COUNT(*)` }).from(agents);
    const logCount = await db.select({ count: sql`COUNT(*)` }).from(agentLogs);
    
    // 获取最近5个日志记录
    const recentLogs = await db
      .select()
      .from(agentLogs)
      .orderBy(sql`id DESC`)
      .limit(5);
    
    // 获取NodeJS和环境信息
    const info = {
      node: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      counts: {
        agents: agentCount[0]?.count || 0,
        logs: logCount[0]?.count || 0,
      },
      recent_logs: recentLogs,
    };
    
    logger.tool.info(toolId, '获取系统信息成功', { 
      duration: Date.now() - startTime 
    });
    
    return {
      success: true,
      data: info,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, '获取系统信息失败', { error: errorMessage });
    
    return {
      success: false,
      error: `获取系统信息失败: ${errorMessage}`,
    };
  }
};

// 测试API连接和功能
const testApi = async (params: any) => {
  const toolId = 'debug-tool';
  const startTime = Date.now();
  const endpoint = params?.endpoint || 'agent-storage';
  
  try {
    logger.tool.debug(toolId, `测试API: ${endpoint}`, { params });
    
    const results: {
      api_health: boolean;
      endpoint: string;
      response_time_ms: number;
      tested_at: string;
      data?: any;
    } = {
      api_health: true,
      endpoint: endpoint,
      response_time_ms: 0,
      tested_at: new Date().toISOString(),
    };
    
    // 简单测试不同的API端点
    switch (endpoint) {
      case 'agent-storage':
        // 尝试获取所有智能体
        const allAgents = await db.select().from(agents);
        results.data = { 
          agent_count: allAgents.length 
        };
        break;
      
      case 'db':
        // 测试数据库连接
        const dbResult = await db.select({ result: sql`1+1` });
        results.data = { 
          connected: dbResult.length > 0,
          result: dbResult[0]?.result
        };
        break;
      
      default:
        results.data = { 
          message: `未定义的测试端点: ${endpoint}` 
        };
    }
    
    // 计算响应时间
    results.response_time_ms = Date.now() - startTime;
    
    logger.tool.info(toolId, `API测试成功: ${endpoint}`, { 
      duration: results.response_time_ms
    });
    
    return {
      success: true,
      data: results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, `API测试失败: ${endpoint}`, { error: errorMessage });
    
    return {
      success: false,
      error: `API测试失败: ${errorMessage}`,
      data: {
        api_health: false,
        endpoint: endpoint,
        response_time_ms: Date.now() - startTime,
        tested_at: new Date().toISOString(),
      },
    };
  }
};

// 获取最近的日志
const getLogs = async (params: any) => {
  const toolId = 'debug-tool';
  const startTime = Date.now();
  
  try {
    const limit = params?.limit || 10;
    const logType = params?.type || null;
    
    logger.tool.debug(toolId, '获取日志', { limit, type: logType });
    
    // 构建查询
    let query = db
      .select()
      .from(agentLogs)
      .orderBy(sql`id DESC`);
    
    // 注意: 不能使用链式调用limit和where，需要分别构建
    let limitedQuery = query.limit(limit);
    
    let logs;
    if (logType) {
      logs = await limitedQuery
        .where(eq(agentLogs.type, logType));
    } else {
      logs = await limitedQuery;
    }
    
    logger.tool.info(toolId, `成功获取${logs.length}条日志`, { 
      duration: Date.now() - startTime 
    });
    
    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, '获取日志失败', { error: errorMessage });
    
    return {
      success: false,
      error: `获取日志失败: ${errorMessage}`,
    };
  }
};

// 检查请求内容和请求头
const inspectRequest = async (params: any, request: any) => {
  const toolId = 'debug-tool';
  
  try {
    const result = {
      headers: request.headers || {},
      context: request,
      params: params,
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        platform: process.platform,
        node_version: process.version,
      },
    };
    
    logger.tool.info(toolId, '请求检查完成');
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, '请求检查失败', { error: errorMessage });
    
    return {
      success: false,
      error: `请求检查失败: ${errorMessage}`,
    };
  }
};

// 健康检查
const healthCheck = async () => {
  const toolId = 'debug-tool';
  const startTime = Date.now();
  
  try {
    // 检查数据库连接
    const dbTest = await db.select({ result: sql`1` });
    const dbConnected = dbTest.length > 0 && dbTest[0].result === 1;
    
    // 检查文件系统访问
    const logDirPath = path.resolve('./logs');
    const fsAccess = fs.existsSync(logDirPath);
    
    const result = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      checks: {
        database: {
          status: dbConnected ? 'connected' : 'disconnected',
          response_time_ms: Date.now() - startTime
        },
        filesystem: {
          status: fsAccess ? 'accessible' : 'inaccessible',
          logs_path: logDirPath
        },
        memory: {
          usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    };
    
    logger.tool.info(toolId, '健康检查完成', result);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logger.tool.error(toolId, '健康检查失败', { error: errorMessage });
    
    return {
      success: false,
      error: `健康检查失败: ${errorMessage}`,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage
      }
    };
  }
}; 