# Mastrax

Mastra extension package for Lumos Studio.

## 开发说明

### 安装

```bash
# 使用npm
npm install

# 或使用bun
bun install
```

### 运行开发服务器

```bash
# 使用npm
npm run dev

# 或使用bun
bun run dev
```

## 工具API参考

### 智能体存储工具 (agent-storage)

用于管理本地智能体，包括创建、更新、删除和获取操作。

#### 请求格式

所有请求必须包含一个`data`对象，内部包含`operation`字段和其他必要参数：

```json
{
  "data": {
    "operation": "操作类型",
    "agent": {}, // 对于create/update操作提供
    "agentId": "agent-id" // 对于get/delete操作提供
  }
}
```

#### 操作类型

1. **创建智能体** (`create`)

```json
{
  "data": {
    "operation": "create",
    "agent": {
      "name": "智能体名称",
      "description": "智能体描述",
      "instructions": "智能体指令",
      "model": "gpt-4-turbo",
      "type": "general",
      "categories": ["类别1", "类别2"]
    }
  }
}
```

2. **更新智能体** (`update`)

```json
{
  "data": {
    "operation": "update",
    "agent": {
      "id": "agent-id",
      "name": "新的名称",
      "description": "新的描述"
    }
  }
}
```

3. **获取单个智能体** (`get`)

```json
{
  "data": {
    "operation": "get",
    "agentId": "agent-id"
  }
}
```

4. **获取所有智能体** (`getAll`)

```json
{
  "data": {
    "operation": "getAll"
  }
}
```

5. **删除智能体** (`delete`)

```json
{
  "data": {
    "operation": "delete",
    "agentId": "agent-id"
  }
}
```

### 调试工具 (debug-tool)

用于系统调试和诊断问题。

#### 请求格式

```json
{
  "data": {
    "action": "操作类型",
    "params": {} // 可选参数
  }
}
```

#### 操作类型

1. **获取系统信息** (`info`)

```json
{
  "data": {
    "action": "info"
  }
}
```

2. **测试API连接** (`test-api`)

```json
{
  "data": {
    "action": "test-api",
    "params": {
      "endpoint": "agent-storage" // 或其他端点
    }
  }
}
```

3. **获取日志** (`get-logs`)

```json
{
  "data": {
    "action": "get-logs",
    "params": {
      "limit": 10,
      "type": "AGENT" // 可选过滤日志类型
    }
  }
}
```

4. **检查请求内容** (`inspect-request`)

```json
{
  "data": {
    "action": "inspect-request",
    "params": {
      "any_custom_param": "value"
    }
  }
}
```

5. **健康检查** (`health-check`)

```json
{
  "data": {
    "action": "health-check"
  }
}
```

6. **API格式检查** (`inspect-api-format`)

用于诊断API请求格式问题，分析传入参数结构。

```json
{
  "data": {
    "action": "inspect-api-format"
  }
}
```

## 常见问题

### 错误："缺少必要的data参数"

这个错误通常是因为请求格式不正确。确保所有请求都包含一个`data`对象，例如：

错误的格式：
```json
{
  "operation": "create",
  "agent": {}
}
```

正确的格式：
```json
{
  "data": {
    "operation": "create",
    "agent": {}
  }
}
```

### 其他问题

如果遇到其他问题，可以使用debug-tool工具的inspect-api-format功能来诊断API请求格式问题：

```json
{
  "data": {
    "action": "inspect-api-format"
  }
}
```

# Mastra Integration for Tauri

This directory contains the Mastra framework implementation that is integrated with the Tauri desktop application.

## Structure

- **scripts/build-for-tauri.js**: Script to build the Mastra project for inclusion in the Tauri application
- **.env.development**: Development environment variables
- **.env**: Production environment variables

## Development

For development, the Mastra service runs on port 4111 and is managed by the Tauri application. The API client in the frontend app communicates with this service.

To start the development environment:

```bash
npm run tauri:dev
```

This starts both the Tauri application and the Mastra service.

## Production

For production builds, the Mastra service is bundled with the Tauri application. The build process:

1. Builds the Mastra service using `mastra build`
2. Packages the built files into the Tauri application resources
3. The Rust service manager starts and manages the Mastra service when the app runs

To build for production:

```bash
# First build the Mastra service
cd mastrax
bun run scripts/build-for-tauri.js

# Then build the Tauri application
cd ..
npm run tauri:build
```

## API Client

The API client in `src/api/mastra.ts` provides methods to interact with the Mastra service:

- `getAgents()`: List available agents
- `generate()`: Generate a response from an agent
- `streamGenerate()`: Stream a response from an agent
- `isRunning()`: Check if the Mastra service is running

## UI Components

The `MastraChat` component provides a simple UI for interacting with Mastra agents

## Architecture

- The Mastra service runs as a background process managed by the Tauri application
- In development mode, the service is run directly from source
- In production mode, the service is bundled with the application
- Communication is done via HTTP on port 4111
- The frontend uses an API client to communicate with the service

## API Usage

```typescript
import { MastraAPI } from '../api/mastra';

// Check if the service is running
const isRunning = await MastraAPI.isRunning();

// Get available agents
const agents = await MastraAPI.getAgents();

// Generate text from an agent
const response = await MastraAPI.generate('weatherAgent', {
  messages: ['What is the weather in London?']
});

console.log(response.text);
```

## 智能体存储工具

该项目包含一个智能体存储工具，用于持久化存储智能体配置。该工具支持以下操作：

### 使用示例

直接与agentManager智能体交互：

```
// 创建智能体
请创建一个名为"翻译助手"的智能体，它可以帮助用户翻译不同语言之间的文本。使用GPT-4模型，温度设置为0.3。

// 获取所有智能体
请列出所有已创建的智能体。

// 获取特定智能体
请查询id为"agent-1234567890"的智能体的详细信息。

// 更新智能体
请更新id为"agent-1234567890"的智能体，将其描述改为"专业多语言翻译助手"，温度调整为0.5。

// 删除智能体
请删除id为"agent-1234567890"的智能体。
```

### 存储细节

- 智能体数据以JSON格式存储在`agents.json`文件中
- 该文件位于项目根目录下的数据目录中
- 每个智能体都有唯一的ID和创建/更新时间戳
- 支持智能体的完整生命周期管理

## Custom Agents

To add custom agents:

1. Create a new agent in `src/mastra/agents/`
2. Register the agent in `src/mastra/index.ts`
3. Rebuild the service

## Troubleshooting

- If the service fails to start, check the Tauri application logs
- Make sure the port 4111 is not already in use
- Check that your environment variables are correctly set
- If you're getting authentication errors, check your API key 