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

支持两种请求格式：

1. **带data包装的请求** (推荐用于兼容性)

```json
{
  "data": {
    "operation": "操作类型",
    // 其他特定操作所需的参数
  }
}
```

2. **直接请求** (无需data包装)

```json
{
  "operation": "操作类型",
  // 其他特定操作所需的参数
}
```

两种格式均支持相同的操作和参数。

#### 操作类型

每种操作类型需要不同的参数：

1. **获取单个智能体** (`get`)

```json
{
  "operation": "get",
  "agentId": "agent-id" // 必填，智能体ID
}
```

2. **获取所有智能体** (`getAll`)

```json
{
  "operation": "getAll"
}
```

3. **创建智能体** (`create`)

```json
{
  "operation": "create",
  "agent": {
    "id": "agent-xxxx", // 可选，如不提供将自动生成
    "name": "智能体名称", // 必填
    "description": "智能体描述", // 可选
    "instructions": "智能体指令", // 可选
    "model": "gpt-4-turbo", // 可选
    "temperature": 0.7, // 可选，0-1之间
    "maxTokens": 2048, // 可选，正整数
    "tools": ["tool-id-1", "tool-id-2"], // 可选，工具ID数组
    "systemAgent": false, // 可选，是否系统智能体
    "type": "general", // 可选，智能体类型
    "categories": ["类别1", "类别2"], // 可选，分类标签
    "version": "1.0.0", // 可选，版本号
    "createdAt": 1743680976657, // 可选，创建时间戳
    "updatedAt": 1743680976657, // 可选，更新时间戳 
    "avatar": "/path/to/avatar.png" // 可选，头像路径
  }
}
```

4. **更新智能体** (`update`)

```json
{
  "operation": "update",
  "agent": {
    "id": "agent-id", // 必填，智能体ID
    "name": "新的名称", // 至少更新一个属性
    "description": "新的描述",
    // 其他可选属性同create操作
    "type": "coding", // 可选，更新智能体类型
    "categories": ["编程", "开发", "调试"] // 可选，更新分类标签
  }
}
```

5. **删除智能体** (`delete`)

```json
{
  "operation": "delete",
  "agentId": "agent-id" // 必填，智能体ID
}
```

#### 响应格式

所有响应都遵循以下格式：

```json
{
  "success": true, // 或false表示失败
  "data": {}, // 操作成功时返回的数据
  "error": "错误消息" // 操作失败时返回的错误信息
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

## 数据验证

新版API使用Zod进行数据验证，提供更清晰的错误信息：

- 智能体名称不能为空
- 智能体ID不能为空（update和get/delete操作必填，create操作可选）
- 温度必须是0到1之间的数值
- maxTokens必须是正整数
- 所有其他字段均为可选项

## 附加智能体属性

除了基本属性外，智能体还支持以下扩展属性：

- `type`: 智能体类型，如"general", "coding", "writing"等
- `categories`: 分类标签数组，用于组织和筛选智能体
- `version`: 版本号，用于智能体版本控制
- `createdAt`: 创建时间戳(毫秒)
- `updatedAt`: 更新时间戳(毫秒)
- `avatar`: 智能体头像的路径或URL

## 常见问题

### 错误："缺少必要的操作参数"

如果收到此错误，请确保请求中包含`operation`字段，例如：

错误的格式：
```json
{
  "agent": {}
}
```

正确的格式：
```json
{
  "operation": "create",
  "agent": {}
}
```

### 错误："不支持的操作类型"

请确保`operation`字段的值是以下之一：
- `get` - 获取单个智能体
- `getAll` - 获取所有智能体
- `create` - 创建智能体
- `update` - 更新智能体
- `delete` - 删除智能体

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