import { Mastra } from "@mastra/core";
import { createLogger } from "@mastra/core/logger";
import { weatherWorkflow } from "./workflows";
import { agents } from "./agents";
import logger from "./logging";
import { v4 as uuidv4 } from 'uuid';
import { initDatabaseSync, getDatabaseStatus } from "./db";

// 添加日志扩展
if (!logger.http) {
  logger.http = {
    debug: (message: string, metadata?: Record<string, any>) => logger.debug(message, metadata),
    info: (message: string, metadata?: Record<string, any>) => logger.info(message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.warn(message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.error(message, metadata)
  };
}

// 同步初始化数据库 - 确保在服务器启动前完成
const dbInitialized = initDatabaseSync();
logger.info('数据库初始化状态', { initialized: dbInitialized });

// 创建请求处理中间件
function createRequestMiddleware() {
  return {
    handler: async (c: any, next: () => Promise<void>) => {
      const requestId = uuidv4();
      const startTime = Date.now();
      
      // 为所有请求添加CORS头
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-mastra-dev-playground');
      c.header('Access-Control-Max-Age', '86400');
      
      // 记录客户端信息
      const clientType = c.req.header('x-client-type') || 'unknown';
      const clientId = c.req.header('x-client-id') || 'unknown';
      
      // 记录请求信息
      logger.debug(`收到请求: ${c.req.method} ${c.req.url}`, {
        requestId,
        clientType,
        clientId
      });
      
      // 对OPTIONS请求快速返回204
      if (c.req.method === 'OPTIONS') {
        logger.debug(`处理OPTIONS请求: clientType=${clientType}, clientId=${clientId}`);
        return new Response(null, { status: 204 });
      }
      
      // 请求转换中间件 - 处理格式不正确的请求
      if (c.req.method === 'POST' && c.req.url?.includes('/tools/')) {
        try {
          // 尝试获取和解析请求体
          const json = await c.req.json().catch(() => null);
          
          if (json && typeof json === 'object' && !json.data) {
            // 检查是否包含常见的工具参数 (operation或action)
            if (json.operation || json.action) {
              logger.debug('检测到格式不正确的请求，自动修正', { 
                requestId,
                originalFormat: Object.keys(json)
              });
              
              // 修正为正确格式
              const correctedData = { data: json };
              
              // 替换请求体 (通过自定义属性)
              c._correctedBody = correctedData;
              logger.debug('请求格式已修正', { 
                requestId, 
                correctedFormat: Object.keys(correctedData)
              });
            }
          }
        } catch (error) {
          logger.error('处理请求体失败', { 
            requestId, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
      
      const start = Date.now();
      try {
        // 执行下一个中间件
        await next();
        
        // 记录请求完成
        const duration = Date.now() - start;
        logger.debug(`请求处理完成: ${c.req.method} ${c.req.url} - ${duration}ms`);
      } catch (error) {
        // 记录请求错误
        const duration = Date.now() - start;
        logger.error(`请求处理失败: ${c.req.method} ${c.req.url}`, { 
          requestId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration
        });
        
        // 如果响应未发送，返回500错误
        return new Response(JSON.stringify({ 
          error: '服务器内部错误',
          message: error instanceof Error ? error.message : String(error)
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  };
}

// 创建并配置 Mastra 实例
export const mastra = new Mastra({
  serverMiddleware: [
    createRequestMiddleware() // 在构造函数中直接添加中间件
  ],
  workflows: { weatherWorkflow },
  agents,
  logger: createLogger({
    name: 'Mastra',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }),
});

// 暴露其他模块
export * from "./workflows";
export * from "./agents";
export * from "./logging";
export * from "./tools";
export { getDatabaseStatus } from "./db";
