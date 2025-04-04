/**
 * sessionAnalytics.ts
 * 提供会话分析和监控功能，用于跟踪会话使用情况和性能指标
 */

import { Session, Message } from './types';
import * as Storage from './storage';

// 分析数据存储键
const ANALYTICS_STORAGE_KEY = 'lumos-session-analytics';

// 会话指标类型定义
interface SessionMetrics {
  sessionId: string;
  createdAt: number;
  lastAccessed: number;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  totalTokens: number; // 估算值
  averageResponseTime: number;
  responseTimes: number[];
}

// 全局分析数据
interface AnalyticsData {
  sessionsCreated: number;
  totalMessages: number;
  totalUserMessages: number;
  totalAssistantMessages: number;
  totalSessions: number;
  activeSessions: number;
  lastUpdated: number;
  sessionMetrics: Record<string, SessionMetrics>;
}

/**
 * 获取默认的分析数据结构
 */
const getDefaultAnalyticsData = (): AnalyticsData => ({
  sessionsCreated: 0,
  totalMessages: 0,
  totalUserMessages: 0,
  totalAssistantMessages: 0,
  totalSessions: 0,
  activeSessions: 0,
  lastUpdated: Date.now(),
  sessionMetrics: {}
});

/**
 * 从本地存储获取分析数据
 */
const getAnalyticsData = (): AnalyticsData => {
  try {
    const data = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!data) {
      return getDefaultAnalyticsData();
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('[SessionAnalytics] 获取分析数据失败:', error);
    return getDefaultAnalyticsData();
  }
};

/**
 * 保存分析数据到本地存储
 */
const saveAnalyticsData = (data: AnalyticsData): void => {
  try {
    // 限制数据大小，仅保留最近的20个会话的详细指标
    const metrics = { ...data.sessionMetrics };
    const sessionIds = Object.keys(metrics);
    
    if (sessionIds.length > 20) {
      // 按最后访问时间排序并保留最近的20个
      const sortedIds = sessionIds
        .sort((a, b) => metrics[b].lastAccessed - metrics[a].lastAccessed)
        .slice(20);
      
      sortedIds.forEach(id => {
        delete metrics[id];
      });
      
      data.sessionMetrics = metrics;
    }
    
    data.lastUpdated = Date.now();
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[SessionAnalytics] 保存分析数据失败:', error);
  }
};

/**
 * 记录会话创建事件
 * 
 * @param sessionId 新创建的会话ID
 */
export const trackSessionCreated = (sessionId: string): void => {
  try {
    const analytics = getAnalyticsData();
    
    // 更新全局计数
    analytics.sessionsCreated += 1;
    analytics.totalSessions += 1;
    analytics.activeSessions += 1;
    
    // 创建新的会话指标
    analytics.sessionMetrics[sessionId] = {
      sessionId,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      messageCount: 0,
      userMessageCount: 0,
      assistantMessageCount: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
    
    saveAnalyticsData(analytics);
    console.log(`[SessionAnalytics] 记录新会话创建: ${sessionId}`);
  } catch (error) {
    console.error('[SessionAnalytics] 记录会话创建失败:', error);
  }
};

/**
 * 记录会话访问事件
 * 
 * @param sessionId 被访问的会话ID
 */
export const trackSessionAccessed = (sessionId: string): void => {
  try {
    const analytics = getAnalyticsData();
    
    // 如果会话指标不存在，初始化它
    if (!analytics.sessionMetrics[sessionId]) {
      analytics.sessionMetrics[sessionId] = {
        sessionId,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        messageCount: 0,
        userMessageCount: 0,
        assistantMessageCount: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        responseTimes: []
      };
    } else {
      // 更新访问时间
      analytics.sessionMetrics[sessionId].lastAccessed = Date.now();
    }
    
    saveAnalyticsData(analytics);
  } catch (error) {
    console.error('[SessionAnalytics] 记录会话访问失败:', error);
  }
};

/**
 * 记录新消息的添加
 * 
 * @param sessionId 会话ID
 * @param message 添加的消息
 * @param responseTime 响应时间(毫秒)，仅对助手消息有效
 */
export const trackMessageAdded = (
  sessionId: string, 
  message: Message, 
  responseTime?: number
): void => {
  try {
    const analytics = getAnalyticsData();
    
    // 如果会话指标不存在，初始化它
    if (!analytics.sessionMetrics[sessionId]) {
      trackSessionCreated(sessionId);
      analytics.sessionMetrics[sessionId] = {
        sessionId,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        messageCount: 0,
        userMessageCount: 0,
        assistantMessageCount: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        responseTimes: []
      };
    }
    
    // 更新会话指标
    const metrics = analytics.sessionMetrics[sessionId];
    metrics.messageCount += 1;
    metrics.lastAccessed = Date.now();
    
    // 估计token数量 (粗略估计: 每4个字符约1个token)
    const contentLength = (message.content || '').length;
    const estimatedTokens = Math.ceil(contentLength / 4);
    metrics.totalTokens += estimatedTokens;
    
    // 根据角色更新计数
    if (message.role === 'user') {
      metrics.userMessageCount += 1;
      analytics.totalUserMessages += 1;
    } else if (message.role === 'assistant') {
      metrics.assistantMessageCount += 1;
      analytics.totalAssistantMessages += 1;
      
      // 记录响应时间
      if (responseTime) {
        metrics.responseTimes.push(responseTime);
        
        // 计算平均响应时间
        const sum = metrics.responseTimes.reduce((a, b) => a + b, 0);
        metrics.averageResponseTime = sum / metrics.responseTimes.length;
      }
    }
    
    // 更新全局计数
    analytics.totalMessages += 1;
    
    saveAnalyticsData(analytics);
  } catch (error) {
    console.error('[SessionAnalytics] 记录消息添加失败:', error);
  }
};

/**
 * 记录会话删除事件
 * 
 * @param sessionId 被删除的会话ID
 */
export const trackSessionDeleted = (sessionId: string): void => {
  try {
    const analytics = getAnalyticsData();
    
    // 如果会话指标存在，删除它并更新计数
    if (analytics.sessionMetrics[sessionId]) {
      delete analytics.sessionMetrics[sessionId];
      analytics.totalSessions = Math.max(0, analytics.totalSessions - 1);
      analytics.activeSessions = Math.max(0, analytics.activeSessions - 1);
    }
    
    saveAnalyticsData(analytics);
    console.log(`[SessionAnalytics] 记录会话删除: ${sessionId}`);
  } catch (error) {
    console.error('[SessionAnalytics] 记录会话删除失败:', error);
  }
};

/**
 * 获取会话使用情况统计
 * 
 * @returns 分析数据摘要
 */
export const getSessionStats = () => {
  const analytics = getAnalyticsData();
  
  // 计算近7天活跃会话数
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const recentlyActiveSessions = Object.values(analytics.sessionMetrics)
    .filter(m => (now - m.lastAccessed) < SEVEN_DAYS)
    .length;
  
  // 计算平均每个会话的消息数
  const messagesPerSession = analytics.totalSessions > 0 
    ? analytics.totalMessages / analytics.totalSessions 
    : 0;
  
  return {
    totalSessions: analytics.totalSessions,
    activeSessions: analytics.activeSessions,
    recentlyActiveSessions,
    totalMessages: analytics.totalMessages,
    userMessages: analytics.totalUserMessages,
    assistantMessages: analytics.totalAssistantMessages,
    messagesPerSession: Math.round(messagesPerSession * 10) / 10,
    lastUpdated: new Date(analytics.lastUpdated).toISOString()
  };
};

/**
 * 获取特定会话的详细指标
 * 
 * @param sessionId 会话ID
 * @returns 会话指标，如果会话不存在则返回null
 */
export const getSessionMetrics = (sessionId: string): SessionMetrics | null => {
  try {
    const analytics = getAnalyticsData();
    return analytics.sessionMetrics[sessionId] || null;
  } catch (error) {
    console.error('[SessionAnalytics] 获取会话指标失败:', error);
    return null;
  }
};

/**
 * 清除分析数据
 */
export const clearAnalyticsData = (): void => {
  try {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    console.log('[SessionAnalytics] 已清除所有分析数据');
  } catch (error) {
    console.error('[SessionAnalytics] 清除分析数据失败:', error);
  }
};

export default {
  trackSessionCreated,
  trackSessionAccessed,
  trackMessageAdded,
  trackSessionDeleted,
  getSessionStats,
  getSessionMetrics,
  clearAnalyticsData
}; 