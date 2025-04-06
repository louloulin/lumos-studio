import MastraService from './mastra';
import * as ChatService from './chat';
import * as SessionService from './session';
import * as StorageService from './storage';
import SessionSync from './sessionSync';
import SessionAnalytics from './sessionAnalytics';
import * as types from './types';

// Helper function to safely check environment variables
const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

console.log('[Services] 导出服务:', {
  hasMastraService: !!MastraService,
  hasChatService: !!ChatService,
  chatServiceFunctions: Object.keys(ChatService),
  // 检测是否存在mock配置
  isMockEnabled: getEnvVar('USE_MOCK_API') === 'true' || getEnvVar('VITE_USE_MOCK_API') === 'true',
  environment: getEnvVar('NODE_ENV') || (typeof import.meta !== 'undefined' ? import.meta.env?.MODE : 'unknown')
});

// 检查是否有人尝试使用mock数据替代真实API
const originalMastra = MastraService;

export {
  MastraService,
  ChatService,
  SessionService,
  StorageService,
  SessionSync,
  SessionAnalytics,
  types,
};

// 默认导出所有服务
export default {
  MastraService,
  ChatService,
  SessionService,
  StorageService,
  SessionSync,
  SessionAnalytics,
};
