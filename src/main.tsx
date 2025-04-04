import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import reportWebVitals from './reportWebVitals'
import './i18n'
import './static/index.css'
import './static/globals.css'

// Setup Sentry
import './setup/sentry_init'

// Setup GA
import './setup/ga_init'

// Initialize session service
import SessionService from './services/session'

// Initialize session service
console.log('初始化会话管理系统...');
try {
  // 首先初始化会话同步
  SessionService.initSessionService();
  console.log('会话管理系统初始化成功');
  
  // 添加全局错误处理
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    // 如果是会话相关的错误，尝试修复
    if (event.reason && typeof event.reason === 'object' && 
        (event.reason.message?.includes('会话') || event.reason.message?.includes('session'))) {
      console.warn('检测到会话相关错误，尝试恢复...');
      // 尝试从备份恢复
      try {
        const SessionSync = require('./services/sessionSync').default;
        if (SessionSync && typeof SessionSync.restoreSessions === 'function') {
          const restored = SessionSync.restoreSessions();
          console.log('从备份恢复会话' + (restored ? '成功' : '失败'));
        }
      } catch (recoveryError) {
        console.error('会话恢复失败:', recoveryError);
      }
    }
  });
  
  // 定期备份会话数据
  setInterval(() => {
    try {
      const SessionSync = require('./services/sessionSync').default;
      if (SessionSync && typeof SessionSync.backupSessions === 'function') {
        SessionSync.backupSessions();
      }
    } catch (backupError) {
      console.error('自动备份会话失败:', backupError);
    }
  }, 60000); // 每分钟备份一次
  
} catch (error) {
  console.error('会话管理系统初始化失败:', error);
  // 尝试延迟再次初始化
  setTimeout(() => {
    try {
      SessionService.initSessionService();
      console.log('延迟初始化会话管理系统成功');
    } catch (retryError) {
      console.error('延迟初始化会话管理系统也失败:', retryError);
    }
  }, 3000); // 延迟3秒重试
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
