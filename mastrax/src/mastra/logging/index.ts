import { createLogger, LogLevel } from '@mastra/core/logger';
import pino from 'pino';
import pretty from 'pino-pretty';

// 日志消息接口
interface BaseLogMessage {
  message: string;
  destinationPath?: string;
  type?: string;
  [key: string]: any;
}

// 创建控制台日志记录器 - 用于开发环境
const consoleLogger = createLogger({
  name: 'Mastrax',
  level: (process.env.NODE_ENV === 'production' ? 'info' : 'debug') as LogLevel,
});

// 创建格式化流
const prettyStream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
});

// 创建基础日志记录器
const baseLogger = pino(
  {
    name: 'Mastrax',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  },
  prettyStream
);

// 定义工具类型
interface ToolLogger {
  debug: (toolId: string, message: string, metadata?: Record<string, any>) => void;
  info: (toolId: string, message: string, metadata?: Record<string, any>) => void;
  warn: (toolId: string, message: string, metadata?: Record<string, any>) => void;
  error: (toolId: string, message: string, metadata?: Record<string, any>) => void;
  request: (toolId: string, requestData: any) => void;
  response: (toolId: string, responseData: any, durationMs: number) => void;
}

// 定义HTTP日志器类型
interface HttpLogger {
  debug: (message: string, metadata?: Record<string, any>) => void;
  info: (message: string, metadata?: Record<string, any>) => void;
  warn: (message: string, metadata?: Record<string, any>) => void;
  error: (message: string, metadata?: Record<string, any>) => void;
}

// 扩展Logger类型
interface Logger {
  debug: (message: string, metadata?: Record<string, any>) => void;
  info: (message: string, metadata?: Record<string, any>) => void;
  warn: (message: string, metadata?: Record<string, any>) => void;
  error: (message: string, metadata?: Record<string, any>) => void;
  fatal: (message: string, metadata?: Record<string, any>) => void;
  trace: (message: string, metadata?: Record<string, any>) => void;
  tool: ToolLogger;
  http: HttpLogger;
}

// 创建工具日志记录器
const toolLogger: ToolLogger = {
  debug: (toolId, message, metadata) => {
    baseLogger.debug({
      type: 'TOOL',
      toolId,
      ...metadata,
      destinationPath: `tools/${toolId}`,
    }, message);
  },
  info: (toolId, message, metadata) => {
    baseLogger.info({
      type: 'TOOL',
      toolId,
      ...metadata,
      destinationPath: `tools/${toolId}`,
    }, message);
  },
  warn: (toolId, message, metadata) => {
    baseLogger.warn({
      type: 'TOOL',
      toolId,
      ...metadata,
      destinationPath: `tools/${toolId}`,
    }, message);
  },
  error: (toolId, message, metadata) => {
    baseLogger.error({
      type: 'TOOL',
      toolId,
      ...metadata,
      destinationPath: `tools/${toolId}`,
    }, message);
  },
  request: (toolId, requestData) => {
    baseLogger.debug({
      type: 'TOOL_REQUEST',
      toolId,
      requestData: typeof requestData === 'string' ? requestData : JSON.stringify(requestData, null, 2),
      destinationPath: `tools/${toolId}/requests`,
    }, `工具请求: ${toolId}`);
  },
  response: (toolId, responseData, durationMs) => {
    baseLogger.debug({
      type: 'TOOL_RESPONSE',
      toolId,
      responseData: typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2),
      durationMs,
      destinationPath: `tools/${toolId}/responses`,
    }, `工具响应: ${toolId}`);
  }
};

// 创建HTTP日志记录器
const httpLogger: HttpLogger = {
  debug: (message, metadata) => {
    baseLogger.debug({
      type: 'HTTP',
      ...metadata,
    }, message);
  },
  info: (message, metadata) => {
    baseLogger.info({
      type: 'HTTP',
      ...metadata,
    }, message);
  },
  warn: (message, metadata) => {
    baseLogger.warn({
      type: 'HTTP',
      ...metadata,
    }, message);
  },
  error: (message, metadata) => {
    baseLogger.error({
      type: 'HTTP',
      ...metadata,
    }, message);
  }
};

// 扩展日志记录器
export const logger: Logger = {
  debug: (message, metadata) => baseLogger.debug(metadata || {}, message),
  info: (message, metadata) => baseLogger.info(metadata || {}, message),
  warn: (message, metadata) => baseLogger.warn(metadata || {}, message),
  error: (message, metadata) => baseLogger.error(metadata || {}, message),
  fatal: (message, metadata) => baseLogger.fatal(metadata || {}, message),
  trace: (message, metadata) => baseLogger.trace(metadata || {}, message),
  tool: toolLogger,
  http: httpLogger
};

export default logger; 