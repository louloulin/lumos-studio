# Lumos Studio

基于Mastra框架的智能体工作室，借鉴LobeChat的用户体验和界面设计，打造现代化、易用且功能丰富的AI智能体开发和部署平台。

## 主要功能

- **智能白板**: 使用Excalidraw实现的交互式白板，支持绘图和分享到AI聊天
- **AI聊天**: 文字和语音聊天功能，可与AI助手交流
- **多模态支持**: 支持图像、文本、语音等多种输入方式
- **可扩展架构**: 基于Mastra框架构建，易于扩展和定制

## 技术栈

- **前端**: React + Tailwind CSS + Shadcn UI
- **状态管理**: Jotai
- **部署**: Tauri (桌面应用)
- **AI框架**: Mastra

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 启动Mastra服务
cd mastrax && PORT=4112 pnpm dev

# 启动前端开发服务器
pnpm dev

# 启动Tauri应用
bun tauri dev
```

### 构建应用

```bash
bun tauri build
```

## 已完成功能

- ✅ 基础UI界面
- ✅ 文字聊天组件
- ✅ 语音聊天组件
- ✅ 白板组件
- ✅ Jotai状态管理

## 后续计划

- 分支对话功能优化
- 本地模型支持
- 插件系统扩展
- 更多AI服务提供商集成

## 联系我们

如有任何问题或建议，请提交issue或联系开发团队。
