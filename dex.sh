#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 打印启动信息
echo -e "${GREEN}启动 Lumos Studio 开发环境...${NC}"
echo -e "${BLUE}使用 bun 和 concurrently 并行启动 mastrax 和 UI${NC}"

# 终止可能正在运行的进程
echo "清理可能占用的端口..."
kill -9 $(lsof -ti:1420) 2>/dev/null || true
kill -9 $(lsof -ti:4111) 2>/dev/null || true

# 获取当前工作目录的绝对路径
ROOT_DIR=$(pwd)
echo -e "${YELLOW}项目根目录: ${ROOT_DIR}${NC}"

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
  echo "安装主项目依赖..."
  bun install
fi

if [ ! -d "mastrax/node_modules" ]; then
  echo "安装 mastrax 依赖..."
  cd mastrax && bun install && cd "$ROOT_DIR"
fi

# 确保concurrently已安装
if ! bun list | grep -q concurrently; then
  echo "安装 concurrently..."
  bun add -d concurrently
fi

# 启动开发环境
echo -e "${GREEN}启动开发服务器...${NC}"
echo -e "${BLUE}mastrax 将在 http://localhost:4111 运行${NC}"
echo -e "${BLUE}UI 将在 http://localhost:1420 运行${NC}"

# 使用绝对路径分别启动服务
concurrently --kill-others \
  "cd ${ROOT_DIR}/mastrax && bun run dev" \
  "cd ${ROOT_DIR} && bun run dev" 