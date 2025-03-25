import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import reportWebVitals from './reportWebVitals'
import './i18n'
import './static/index.css'
import './static/globals.css'

import './setup/sentry_init'

import './setup/ga_init'

// 计算视口高度并设置CSS变量
const setViewportHeight = () => {
  // 首先获取可视视口高度
  const vh = window.innerHeight * 0.01;
  // 设置CSS变量
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// 初始设置
setViewportHeight();

// 监听调整大小事件
window.addEventListener('resize', () => {
  // 添加防抖延迟
  setTimeout(setViewportHeight, 100);
});

// 在移动设备上，当方向改变时更新
window.addEventListener('orientationchange', () => {
  // 延迟以确保正确获取新尺寸
  setTimeout(setViewportHeight, 200);
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
