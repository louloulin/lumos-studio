#!/usr/bin/env node

/**
 * 开发环境配置脚本
 * 设置环境变量并启动开发服务器
 */

const { spawn } = require('child_process');
const { resolve } = require('path');
const { existsSync, mkdirSync } = require('fs');

// 获取项目根目录
const ROOT_DIR = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(ROOT_DIR, '..');

// 确保.mastra目录存在
const DATA_DIR = resolve(PROJECT_ROOT, '.mastra');
if (!existsSync(DATA_DIR)) {
  console.log(`创建数据目录: ${DATA_DIR}`);
  mkdirSync(DATA_DIR, { recursive: true });
}

// 配置数据库路径
const DB_PATH = resolve(DATA_DIR, 'agent.db');
console.log(`配置数据库路径: ${DB_PATH}`);

// 设置环境变量
const env = {
  ...process.env,
  NODE_ENV: 'development',
  MASTRA_DB_PATH: DB_PATH,
};

// 启动开发服务器
console.log('启动开发服务器...');
const devProcess = spawn('npm', ['run', 'dev'], { 
  env,
  stdio: 'inherit',
  shell: true,
});

// 处理进程事件
devProcess.on('error', (err) => {
  console.error('启动开发服务器失败:', err);
  process.exit(1);
});

// 处理退出信号
process.on('SIGINT', () => {
  console.log('收到中断信号，停止服务器...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('收到终止信号，停止服务器...');
  devProcess.kill('SIGTERM');
});

devProcess.on('exit', (code) => {
  console.log(`开发服务器已退出，退出码: ${code}`);
  process.exit(code);
}); 