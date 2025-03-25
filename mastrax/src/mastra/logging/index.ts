import { createLogger, LogLevel } from '@mastra/core/logger';

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

// 日志记录器接口
const logger = {
  debug: (message: string | BaseLogMessage, metadata?: Record<string, any>) => {
    if (typeof message === 'string') {
      consoleLogger.debug(message, metadata);
    } else {
      consoleLogger.debug(message.message, message);
    }
  },
  
  info: (message: string | BaseLogMessage, metadata?: Record<string, any>) => {
    if (typeof message === 'string') {
      consoleLogger.info(message, metadata);
    } else {
      consoleLogger.info(message.message, message);
    }
  },
  
  warn: (message: string | BaseLogMessage, metadata?: Record<string, any>) => {
    if (typeof message === 'string') {
      consoleLogger.warn(message, metadata);
    } else {
      consoleLogger.warn(message.message, message);
    }
  },
  
  error: (message: string | BaseLogMessage, metadata?: Record<string, any>) => {
    if (typeof message === 'string') {
      consoleLogger.error(message, metadata);
    } else {
      consoleLogger.error(message.message, message);
    }
  },
  
  // 记录智能体相关的日志
  agent: {
    debug: (agentId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.debug(message, {
        destinationPath: `agents/${agentId}`,
        type: 'AGENT',
        agentId,
        ...(metadata || {}),
      });
    },
    
    info: (agentId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.info(message, {
        destinationPath: `agents/${agentId}`,
        type: 'AGENT',
        agentId,
        ...(metadata || {}),
      });
    },
    
    warn: (agentId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.warn(message, {
        destinationPath: `agents/${agentId}`,
        type: 'AGENT',
        agentId,
        ...(metadata || {}),
      });
    },
    
    error: (agentId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.error(message, {
        destinationPath: `agents/${agentId}`,
        type: 'AGENT',
        agentId,
        ...(metadata || {}),
      });
    },
  },
  
  // 记录工作流相关的日志
  workflow: {
    debug: (workflowId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.debug(message, {
        destinationPath: `workflows/${workflowId}`,
        type: 'WORKFLOW',
        workflowId,
        ...(metadata || {}),
      });
    },
    
    info: (workflowId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.info(message, {
        destinationPath: `workflows/${workflowId}`,
        type: 'WORKFLOW',
        workflowId,
        ...(metadata || {}),
      });
    },
    
    warn: (workflowId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.warn(message, {
        destinationPath: `workflows/${workflowId}`,
        type: 'WORKFLOW',
        workflowId,
        ...(metadata || {}),
      });
    },
    
    error: (workflowId: string, message: string, metadata?: Record<string, any>) => {
      consoleLogger.error(message, {
        destinationPath: `workflows/${workflowId}`,
        type: 'WORKFLOW',
        workflowId,
        ...(metadata || {}),
      });
    },
  },
};

export { logger }; 