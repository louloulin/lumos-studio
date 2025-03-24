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