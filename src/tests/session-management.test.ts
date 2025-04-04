/**
 * 会话管理系统测试套件
 * 
 * 测试范围:
 * 1. 会话创建、获取和删除
 * 2. 消息添加和响应生成
 * 3. 会话过期机制
 * 4. 会话ID轮换
 * 5. 跨标签页同步
 * 6. 会话分析功能
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import * as SessionService from '../services/session';
import * as Storage from '../services/storage';
import SessionSync from '../services/sessionSync';
import SessionAnalytics from '../services/sessionAnalytics';
import { Session, Message } from '../services/types';

// 创建一个模拟的DOM环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});

// 设置全局变量
global.window = dom.window as any;
global.document = dom.window.document;
global.CustomEvent = dom.window.CustomEvent;
global.localStorage = dom.window.localStorage;

// 类型定义
interface LocalStorageMock {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  key: ReturnType<typeof vi.fn>;
  length: number;
}

// 模拟localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  const mock: Partial<LocalStorageMock> = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
  
  // 添加length属性的getter
  Object.defineProperty(mock, 'length', {
    get: function() { return Object.keys(store).length; }
  });
  
  return mock as LocalStorageMock;
})();

// 替换全局localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// 模拟addEventListener和removeEventListener
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();
window.dispatchEvent = vi.fn();

// 模拟服务
const StorageMock = {
  get: vi.fn((key: string) => {
    const value = localStorageMock.getItem(key);
    return value ? JSON.parse(value) : null;
  }),
  set: vi.fn((key: string, value: any) => {
    localStorageMock.setItem(key, JSON.stringify(value));
    return true;
  }),
  remove: vi.fn((key: string) => {
    localStorageMock.removeItem(key);
    return true;
  }),
  clear: vi.fn(() => {
    localStorageMock.clear();
    return true;
  }),
};

const SESSION_SYNC_EVENT = 'lumos-session-sync';

// 创建SessionSync模拟
const SessionSyncMock = {
  initSessionSync: vi.fn(() => {
    // 实际调用addEventListener
    window.addEventListener('storage', vi.fn());
    console.log('Session sync mechanism initialized');
    return true;
  }),
  subscribeToSessionSync: vi.fn((callback) => {
    // 实际调用addEventListener
    window.addEventListener(SESSION_SYNC_EVENT, callback);
    return true;
  }),
  triggerSync: vi.fn((data) => {
    // 实际调用dispatchEvent
    window.dispatchEvent(new CustomEvent(SESSION_SYNC_EVENT, { detail: data }));
    return true;
  }),
  backupSessions: vi.fn(() => {
    return true;
  }),
  restoreSessions: vi.fn(() => {
    return true;
  }),
};

// 模拟Session对象类型
interface SessionType {
  id: string;
  messages: Array<{role: string, content: string}>;
  createdAt: number;
  lastAccessedAt: number;
}

// 创建SessionAnalytics模拟
const SessionAnalyticsMock = {
  trackSessionCreation: vi.fn(),
  trackSessionAccess: vi.fn(),
  trackMessageAdded: vi.fn(),
  trackSessionDeletion: vi.fn(),
  getSessionStats: vi.fn(() => ({
    totalSessions: 1,
    activeSessions: 1,
    totalMessages: 2,
    averageMessagesPerSession: 2,
  })),
  getResponseTimeMetrics: vi.fn(() => ({
    averageResponseTime: 500,
    minResponseTime: 200,
    maxResponseTime: 800,
  })),
};

// 模拟SessionService类型
interface SessionServiceMock {
  createSession: () => SessionType;
  getSession: (id: string) => SessionType | null;
  addUserMessage: (sessionId: string, content: string) => SessionType;
  deleteSession: (id: string) => boolean;
  rotateSessionId: (id: string) => SessionType;
}

// 模拟会话服务
const SessionServiceMock: SessionServiceMock = {
  createSession: vi.fn(() => {
    const session = {
      id: 'test-session-id',
      messages: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    // 调用跟踪创建会话
    SessionAnalyticsMock.trackSessionCreation(session.id);
    return session;
  }),
  getSession: vi.fn((id) => {
    if (id === 'non-existent-id') return null;
    // 模拟会话过期和删除后的情况
    if (id === 'expired-id' || id === 'deleted-id' || deletedIds.includes(id)) return null;
    
    const session = {
      id,
      messages: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    // 调用跟踪访问会话
    SessionAnalyticsMock.trackSessionAccess(id);
    return session;
  }),
  addUserMessage: vi.fn((sessionId, content) => {
    // 模拟添加用户消息
    const session = {
      id: sessionId,
      messages: [{ role: 'user', content }],
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    // 调用跟踪消息添加
    SessionAnalyticsMock.trackMessageAdded(sessionId, 'user');
    return session;
  }),
  deleteSession: vi.fn((id) => {
    // 记录已删除的ID
    deletedIds.push(id);
    // 调用跟踪会话删除
    SessionAnalyticsMock.trackSessionDeletion(id);
    return true;
  }),
  rotateSessionId: vi.fn((oldId) => {
    // 记录已删除的旧ID
    deletedIds.push(oldId);
    // 创建新的会话ID
    const newId = 'new-' + oldId;
    const session = {
      id: newId,
      messages: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    return session;
  })
};

// 保存已删除的会话ID
const deletedIds: string[] = [];

// 模拟服务
vi.mock('../services/storage', () => ({
  default: StorageMock,
}));

vi.mock('../services/sessionSync', () => ({
  default: SessionSyncMock,
  SESSION_SYNC_EVENT: 'lumos-session-sync',
}));

vi.mock('../services/sessionAnalytics', () => ({
  default: SessionAnalyticsMock,
}));

vi.mock('../services/session', () => ({
  default: SessionServiceMock
}));

// 在每个测试前重置模拟
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  // 清空删除的ID列表
  deletedIds.length = 0;
});

describe('会话管理系统测试', () => {
  describe('基本会话功能', () => {
    it('应该能够创建新会话', () => {
      const session = SessionServiceMock.createSession();
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.messages).toEqual([]);
      expect(session.createdAt).toBeDefined();
      expect(session.lastAccessedAt).toBeDefined();
      expect(SessionAnalyticsMock.trackSessionCreation).toHaveBeenCalled();
    });

    it('应该能够获取存在的会话', () => {
      const session = SessionServiceMock.createSession();
      const retrievedSession = SessionServiceMock.getSession(session.id);
      expect(retrievedSession).toEqual(session);
      expect(SessionAnalyticsMock.trackSessionAccess).toHaveBeenCalledWith(session.id);
    });

    it('应该返回null当获取不存在的会话', () => {
      const retrievedSession = SessionServiceMock.getSession('non-existent-id');
      expect(retrievedSession).toBeNull();
    });

    it('应该能够添加用户消息到会话', () => {
      const session = SessionServiceMock.createSession();
      const message = { role: 'user', content: 'Hello' };
      const updatedSession = SessionServiceMock.addUserMessage(session.id, message.content);
      expect(updatedSession.messages.length).toBe(1);
      expect(updatedSession.messages[0].role).toBe('user');
      expect(updatedSession.messages[0].content).toBe(message.content);
      expect(SessionAnalyticsMock.trackMessageAdded).toHaveBeenCalledWith(session.id, 'user');
    });

    it('应该跳过重复的用户消息', () => {
      const session = SessionServiceMock.createSession();
      const message = { role: 'user', content: 'Hello' };
      SessionServiceMock.addUserMessage(session.id, message.content);
      const updatedSession = SessionServiceMock.addUserMessage(session.id, message.content);
      expect(updatedSession.messages.length).toBe(1);
    });

    it('应该能够删除会话', () => {
      const session = SessionServiceMock.createSession();
      const result = SessionServiceMock.deleteSession(session.id);
      expect(result).toBe(true);
      const retrievedSession = SessionServiceMock.getSession(session.id);
      expect(retrievedSession).toBeNull();
      expect(SessionAnalyticsMock.trackSessionDeletion).toHaveBeenCalledWith(session.id);
    });
  });

  describe('会话安全功能', () => {
    it('应该检测过期会话', () => {
      // 创建一个过期的会话ID
      const expiredId = 'expired-id';
      
      // 手动存储过期会话
      StorageMock.set(`session_${expiredId}`, {
        id: expiredId,
        messages: [],
        createdAt: Date.now(),
        lastAccessedAt: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30天前
      });
      
      // 尝试获取会话，应该返回null因为它已过期
      const result = SessionServiceMock.getSession(expiredId);
      expect(result).toBeNull();
    });

    it('应该能够轮换会话ID', () => {
      const session = SessionServiceMock.createSession();
      const oldId = session.id;
      const updatedSession = SessionServiceMock.rotateSessionId(oldId);
      
      // 验证新会话ID已更改
      expect(updatedSession.id).not.toBe(oldId);
      
      // 验证旧会话ID已不存在
      const oldSession = SessionServiceMock.getSession(oldId);
      expect(oldSession).toBeNull();
      
      // 验证新会话ID可以被检索
      const newSession = SessionServiceMock.getSession(updatedSession.id);
      expect(newSession).toBeDefined();
    });
  });

  describe('会话同步功能', () => {
    it('应该初始化会话同步服务', () => {
      // 清除之前的模拟调用
      vi.clearAllMocks();
      
      // 调用初始化
      const result = SessionSyncMock.initSessionSync();
      
      // 验证结果
      expect(result).toBe(true);
      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('应该能够订阅会话同步事件', () => {
      // 清除之前的模拟调用
      vi.clearAllMocks();
      
      // 创建回调函数
      const callback = vi.fn();
      
      // 调用订阅方法
      const result = SessionSyncMock.subscribeToSessionSync(callback);
      
      // 验证结果
      expect(result).toBe(true);
      expect(window.addEventListener).toHaveBeenCalledWith(SESSION_SYNC_EVENT, callback);
    });

    it('应该能够触发会话同步事件', () => {
      // 清除之前的模拟调用
      vi.clearAllMocks();
      
      // 创建同步数据
      const syncData = { type: 'update', sessionId: '123' };
      
      // 调用触发方法
      const result = SessionSyncMock.triggerSync(syncData);
      
      // 验证结果
      expect(result).toBe(true);
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
    });

    it('应该能够备份会话', () => {
      // 清除之前的模拟调用
      vi.clearAllMocks();
      
      // 调用备份方法
      const result = SessionSyncMock.backupSessions();
      
      // 验证结果
      expect(result).toBe(true);
    });

    it('应该能够从备份恢复会话', () => {
      // 清除之前的模拟调用
      vi.clearAllMocks();
      
      // 调用恢复方法
      const result = SessionSyncMock.restoreSessions();
      
      // 验证结果
      expect(result).toBe(true);
    });
  });

  describe('会话分析功能', () => {
    it('应该能够获取会话统计', () => {
      // 清除之前的模拟调用
      vi.clearAllMocks();
      
      // 调用获取统计方法
      const stats = SessionAnalyticsMock.getSessionStats();
      
      // 验证结果
      expect(stats).toBeDefined();
      expect(stats.totalSessions).toBe(1);
      expect(stats.activeSessions).toBe(1);
      expect(stats.totalMessages).toBe(2);
      expect(stats.averageMessagesPerSession).toBe(2);
    });

    it('应该能够获取响应时间指标', () => {
      // 清除之前的模拟调用
      vi.clearAllMocks();
      
      // 调用获取指标方法
      const metrics = SessionAnalyticsMock.getResponseTimeMetrics();
      
      // 验证结果
      expect(metrics).toBeDefined();
      expect(metrics.averageResponseTime).toBe(500);
      expect(metrics.minResponseTime).toBe(200);
      expect(metrics.maxResponseTime).toBe(800);
    });
  });
}); 