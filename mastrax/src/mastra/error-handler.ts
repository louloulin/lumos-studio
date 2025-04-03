/**
 * 错误处理模块，用于标准化API错误响应
 */

import { logger } from './logging';

// 错误类型定义
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',    // 数据验证错误
  REQUEST_FORMAT_ERROR = 'REQUEST_FORMAT_ERROR', // 请求格式错误
  NOT_FOUND = 'NOT_FOUND',                  // 资源不存在
  UNAUTHORIZED = 'UNAUTHORIZED',            // 未授权访问
  FORBIDDEN = 'FORBIDDEN',                  // 禁止访问
  INTERNAL_ERROR = 'INTERNAL_ERROR',        // 内部服务器错误
  DATABASE_ERROR = 'DATABASE_ERROR',        // 数据库错误
  NETWORK_ERROR = 'NETWORK_ERROR',          // 网络错误
  RATE_LIMIT = 'RATE_LIMIT',                // 请求频率限制
  BAD_REQUEST = 'BAD_REQUEST'               // 一般的错误请求
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    code: number;
    details?: any;
    requestId?: string;
  };
}

// 成功响应接口
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  requestId?: string;
}

// API响应类型
export type ApiResponse<T = any> = ErrorResponse | SuccessResponse<T>;

/**
 * 创建错误响应
 * @param type 错误类型
 * @param message 错误消息
 * @param code HTTP状态码
 * @param details 额外的错误详情
 * @param requestId 请求ID
 * @returns 错误响应对象
 */
export function createErrorResponse(
  type: ErrorType,
  message: string,
  code: number = 400,
  details?: any,
  requestId?: string
): ErrorResponse {
  // 记录错误
  logger.error(`[${type}] ${message}`, { code, details, requestId });
  
  return {
    success: false,
    error: {
      type,
      message,
      code,
      details,
      requestId
    }
  };
}

/**
 * 创建成功响应
 * @param data 响应数据
 * @param requestId 请求ID
 * @returns 成功响应对象
 */
export function createSuccessResponse<T = any>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    requestId
  };
}

/**
 * 验证请求是否包含必要的data属性
 * @param data 请求数据
 * @returns 是否有效
 */
export function validateRequestFormat(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  if (!data.data) {
    return false;
  }
  
  return true;
}

/**
 * 处理工具请求错误
 * @param error 错误对象
 * @param requestId 请求ID
 * @returns 标准化的错误响应
 */
export function handleToolError(error: any, requestId?: string): ErrorResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // 记录错误详情
  logger.error('工具执行错误', { error: errorMessage, stack: errorStack, requestId });
  
  // 根据错误类型返回不同的错误响应
  if (errorMessage.includes('not found') || errorMessage.includes('找不到')) {
    return createErrorResponse(
      ErrorType.NOT_FOUND,
      '请求的资源不存在',
      404,
      { originalError: errorMessage },
      requestId
    );
  }
  
  if (errorMessage.includes('permissions') || errorMessage.includes('权限')) {
    return createErrorResponse(
      ErrorType.FORBIDDEN,
      '没有权限执行该操作',
      403,
      { originalError: errorMessage },
      requestId
    );
  }
  
  if (errorMessage.includes('format') || errorMessage.includes('格式')) {
    return createErrorResponse(
      ErrorType.REQUEST_FORMAT_ERROR,
      '请求格式错误',
      400,
      { 
        originalError: errorMessage,
        suggestion: '请确保请求包含一个data对象，例如: {"data": {"operation": "getAll"}}'
      },
      requestId
    );
  }
  
  // 默认返回内部错误
  return createErrorResponse(
    ErrorType.INTERNAL_ERROR,
    '服务器内部错误',
    500,
    { originalError: errorMessage },
    requestId
  );
}

/**
 * 自动修正请求格式
 * @param requestData 原始请求数据
 * @returns 修正后的请求数据
 */
export function correctRequestFormat(requestData: any): any {
  // 如果已经是正确格式，直接返回
  if (requestData && typeof requestData === 'object' && requestData.data) {
    return requestData;
  }
  
  // 如果是对象但缺少data包装
  if (requestData && typeof requestData === 'object') {
    // 检查是否包含常见的工具参数 (operation或action)
    if (requestData.operation || requestData.action) {
      // 修正为正确格式
      return { data: requestData };
    }
  }
  
  // 无法修正，返回原始数据
  return requestData;
}