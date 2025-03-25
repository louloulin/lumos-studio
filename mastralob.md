
# MXS 计划：基于 Mastra 构建 LobeChat 风格的智能体工作室

## 项目概述

本项目旨在创建一个基于 Mastra 框架的智能体工作室，借鉴 LobeChat 的用户体验和界面设计，打造一个现代化、易用且功能丰富的 AI 智能体开发和部署平台。该平台将允许用户创建、测试和部署各种智能体，支持多种模型服务商和丰富的功能特性。

### 技术栈
- **框架**: Mastra 作为智能体开发框架
- **前端**: React + Tailwind CSS + Shadcn UI
- **状态管理**: Jotai
- **后端**: Node.js + Mastra Core APIs
- **部署**: 支持本地部署(Tauri)和云端服务
- **通信层**: HTTP RESTful API + WebSocket

## 核心架构设计

```
┌─────────────────────────────────────────┐
│               Tauri 应用                │
│  ┌───────────────┐    ┌───────────────┐ │
│  │               │    │               │ │
│  │  React 前端   │◄───┤ Rust 后端桥接 │ │
│  │               │    │               │ │
│  └───────┬───────┘    └───────────────┘ │
└──────────┼────────────────────────────────┘
           │                  
           ▼                  
┌──────────────────┐          
│                  │          
│ Mastra Client JS │       
│                  │          
└────────┬─────────┘          
         │                      
         │                   
         │        HTTP/WebSocket          
         ▼                  
┌──────────────────────────┐
│                          │
│  Mastra API 服务模块     │
│                          │
└──────────┬───────────────┘
           │
           │
           ▼
┌──────────────────────────┐
│                          │
│     Mastra Core APIs     │
│                          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│                          │
│   AI SDK Model Routing   │
│                          │
└──────────────────────────┘
```

### Mastra API 服务模块设计

我们将创建一个独立的 Mastra API 服务模块，作为 Mastra Client JS 与 Mastra Core APIs 之间的桥梁。该模块将提供 RESTful API 和 WebSocket 接口，处理来自前端的请求，并管理与 Mastra Core 的交互。

```typescript
// src/api/server.ts
import express from 'hono';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { AgentController } from './controllers/AgentController';
import { WorkflowController } from './controllers/WorkflowController';
import { KnowledgeController } from './controllers/KnowledgeController';
import { ModelController } from './controllers/ModelController';

// 创建 Express 应用和 HTTP 服务器
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 初始化控制器
const agentController = new AgentController(io);
const workflowController = new WorkflowController(io);
const knowledgeController = new KnowledgeController();
const modelController = new ModelController();

// RESTful API 路由
app.use('/api/agents', agentController.router);
app.use('/api/workflows', workflowController.router);
app.use('/api/knowledge', knowledgeController.router);
app.use('/api/models', modelController.router);

// WebSocket 事件处理
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // 注册 Socket.io 事件处理器
  agentController.registerSocketEvents(socket);
  workflowController.registerSocketEvents(socket);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3100;
server.listen(PORT, () => {
  console.log(`Mastra API server running on port ${PORT}`);
});
```

### API 控制器实现

为每个核心功能领域创建专门的控制器，处理 HTTP 请求和 WebSocket 事件：

```typescript
// src/api/controllers/AgentController.ts
import { Router } from 'express';
import { Server, Socket } from 'socket.io';
import { Agent, Memory } from '@mastra/core';
import { openai, claude, gemini } from '@ai-sdk/providers';

export class AgentController {
  public router: Router;
  private agents: Map<string, Agent> = new Map();
  private io: Server;
  
  constructor(io: Server) {
    this.router = Router();
    this.io = io;
    
    // 设置 RESTful 路由
    this.setupRoutes();
  }
  
  private setupRoutes() {
    // 创建智能体
    this.router.post('/', async (req, res) => {
      try {
        const { name, instructions, provider, modelName, tools } = req.body;
        
        const modelProvider = this.resolveModelProvider(provider, modelName);
        
        const agent = new Agent({
          name,
          instructions,
          model: modelProvider,
          memory: new Memory(),
          tools: tools || []
        });
        
        const agentId = this.generateUniqueId();
        this.agents.set(agentId, agent);
        
        res.status(201).json({ 
          id: agentId,
          name,
          provider,
          modelName 
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // 获取智能体列表
    this.router.get('/', (req, res) => {
      const agents = Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        name: agent.name,
        // 其他智能体元数据
      }));
      
      res.json(agents);
    });
    
    // 获取特定智能体
    this.router.get('/:id', (req, res) => {
      const agent = this.agents.get(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      res.json({
        id: req.params.id,
        name: agent.name,
        // 其他智能体属性
      });
    });
    
    // 发送消息给智能体 (非流式)
    this.router.post('/:id/generate', async (req, res) => {
      try {
        const agent = this.agents.get(req.params.id);
        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        
        const { message } = req.body;
        const response = await agent.generate(message);
        
        res.json({ response });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // 其他路由: 删除智能体、更新智能体、获取记忆等
  }
  
  // 注册 WebSocket 事件处理器
  public registerSocketEvents(socket: Socket) {
    // 流式响应处理
    socket.on('agent:stream', async (data, callback) => {
      const { agentId, message } = data;
      
      const agent = this.agents.get(agentId);
      if (!agent) {
        return callback({ error: 'Agent not found' });
      }
      
      try {
        // 初始化流式响应
        callback({ status: 'started' });
        
        // 使用 Mastra 的流式生成
        const stream = agent.stream(message);
        
        // 处理流式响应
        for await (const chunk of stream) {
          socket.emit(`agent:stream:${agentId}`, { 
            chunk,
            done: false 
          });
        }
        
        // 完成事件
        socket.emit(`agent:stream:${agentId}`, { 
          done: true 
        });
      } catch (error) {
        socket.emit(`agent:stream:${agentId}`, { 
          error: error.message,
          done: true 
        });
      }
    });
    
    // 其他事件处理器
  }
  
  private resolveModelProvider(provider: string, modelName: string) {
    switch (provider) {
      case 'openai':
        return openai(modelName);
      case 'claude':
        return claude(modelName);
      case 'gemini':
        return gemini(modelName);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
```

### 前端与 Mastra Client 集成

前端将直接通过 HTTP 和 WebSocket 与 Mastra API 服务交互，不再通过 Tauri 桥接：

```typescript
// src/frontend/services/ApiService.ts
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export class ApiService {
  private baseUrl: string;
  private socket: Socket;
  
  constructor(baseUrl = 'http://localhost:3100') {
    this.baseUrl = baseUrl;
    this.socket = io(baseUrl, {
      reconnectionDelayMax: 10000,
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to Mastra API service');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }
  
  // RESTful API 方法
  
  // 创建智能体
  async createAgent(agentConfig) {
    const response = await axios.post(`${this.baseUrl}/api/agents`, agentConfig);
    return response.data;
  }
  
  // 获取智能体列表
  async getAgents() {
    const response = await axios.get(`${this.baseUrl}/api/agents`);
    return response.data;
  }
  
  // 获取单个智能体
  async getAgent(agentId) {
    const response = await axios.get(`${this.baseUrl}/api/agents/${agentId}`);
    return response.data;
  }
  
  // 发送消息 (非流式)
  async generateResponse(agentId, message) {
    const response = await axios.post(`${this.baseUrl}/api/agents/${agentId}/generate`, {
      message
    });
    return response.data.response;
  }
  
  // WebSocket 方法
  
  // 流式生成响应
  streamResponse(agentId, message, onChunk, onComplete, onError) {
    // 注册监听器
    this.socket.on(`agent:stream:${agentId}`, (data) => {
      if (data.error) {
        onError(data.error);
        return;
      }
      
      if (data.done) {
        onComplete();
        return;
      }
      
      onChunk(data.chunk);
    });
    
    // 发送请求
    this.socket.emit('agent:stream', { agentId, message }, (response) => {
      if (response.error) {
        onError(response.error);
      }
    });
  }
  
  // 清理资源
  cleanup() {
    this.socket.disconnect();
  }
}
```

### 前端 React 钩子

基于 ApiService 创建易用的 React 钩子，简化智能体交互：

```typescript
// src/frontend/hooks/useAgent.ts
import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/ApiService';

// 获取或创建 ApiService 单例
const apiService = new ApiService();

export function useAgent(agentId?: string) {
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 加载智能体信息
  useEffect(() => {
    if (!agentId) return;
    
    const fetchAgent = async () => {
      try {
        const data = await apiService.getAgent(agentId);
        setAgent(data);
      } catch (err) {
        setError(err.message);
      }
    };
    
    fetchAgent();
  }, [agentId]);
  
  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!agentId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 添加用户消息
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // 创建临时的 AI 消息
      const tempAiMessageId = Date.now() + 1;
      const tempAiMessage = {
        id: tempAiMessageId.toString(),
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, tempAiMessage]);
      
      // 流式响应处理
      let responseContent = '';
      
      apiService.streamResponse(
        agentId,
        content,
        (chunk) => {
          // 处理流式响应块
          responseContent += chunk;
          
          // 更新临时消息内容
          setMessages(prev => prev.map(msg => 
            msg.id === tempAiMessageId.toString()
              ? { ...msg, content: responseContent }
              : msg
          ));
        },
        () => {
          // 完成时
          setMessages(prev => prev.map(msg => 
            msg.id === tempAiMessageId.toString()
              ? { ...msg, isStreaming: false, content: responseContent }
              : msg
          ));
          setIsLoading(false);
        },
        (errorMsg) => {
          // 错误处理
          setError(errorMsg);
          setIsLoading(false);
          
          // 移除临时消息
          setMessages(prev => prev.filter(msg => msg.id !== tempAiMessageId.toString()));
        }
      );
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [agentId]);
  
  // 创建新的智能体
  const createAgent = useCallback(async (config) => {
    try {
      const newAgent = await apiService.createAgent(config);
      return newAgent;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  return {
    agent,
    messages,
    isLoading,
    error,
    sendMessage,
    createAgent
  };
}
```

### Tauri 集成改进

Tauri 应用现在将主要负责应用程序的打包和分发，而不是作为 Mastra Client 和 Mastra 服务之间的桥梁：

```rust
// src-tauri/src/main.rs
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use std::process::{Command, Stdio};
use std::thread;

// 主函数
fn main() {
  // 创建应用菜单
  let menu = Menu::new()
    .add_submenu(Submenu::new(
      "文件",
      Menu::new()
        .add_item(CustomMenuItem::new("new_agent", "新建智能体"))
        .add_item(CustomMenuItem::new("import", "导入"))
        .add_item(CustomMenuItem::new("export", "导出"))
        .add_native_item(MenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "退出")),
    ))
    // 其他菜单项...
    ;

  // 在单独的线程中启动 Mastra API 服务
  thread::spawn(|| {
    // 启动 Node.js 服务
    let mut child = Command::new("node")
      .args(&["./resources/api/server.js"])
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .spawn()
      .expect("Failed to start API server");
      
    // 监听子进程输出
    let stdout = child.stdout.take().expect("Failed to capture stdout");
    let stderr = child.stderr.take().expect("Failed to capture stderr");
    
    // 处理标准输出
    thread::spawn(move || {
      let reader = std::io::BufReader::new(stdout);
      for line in std::io::BufRead::lines(reader) {
        if let Ok(line) = line {
          println!("API server stdout: {}", line);
        }
      }
    });
    
    // 处理标准错误
    thread::spawn(move || {
      let reader = std::io::BufReader::new(stderr);
      for line in std::io::BufRead::lines(reader) {
        if let Ok(line) = line {
          eprintln!("API server stderr: {}", line);
        }
      }
    });
    
    // 等待子进程完成
    let status = child.wait().expect("Failed to wait for API server");
    println!("API server exited with status: {}", status);
  });
  
  // 构建并运行 Tauri 应用
  tauri::Builder::default()
    .menu(menu)
    .invoke_handler(tauri::generate_handler![])
    .run(tauri::generate_context!())
    .expect("Error while running tauri application");
}
```

## 数据流架构

```
┌─────────────────────┐      ┌─────────────────────┐
│                     │      │                     │
│   用户界面层        │◄────►│   前端状态管理      │
│                     │      │                     │
└──────────┬──────────┘      └─────────┬───────────┘
           │                           │
           │                           │
           ▼                           ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│        HTTP/WebSocket 通信层                    │
│                                                 │
└─────────────────────────┬───────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│              Mastra API 服务层                  │
│                                                 │
├─────────────┬───────────────────┬───────────────┤
│             │                   │               │
│  智能体管理 │   知识库管理      │  模型服务     │
│             │                   │               │
└─────────────┴───────────────────┴───────────────┘
          │                │               │
          │                │               │
          ▼                ▼               ▼
┌─────────────┐  ┌─────────────────┐  ┌───────────┐
│             │  │                 │  │           │
│ 本地存储    │  │  向量数据库     │  │ AI模型    │
│             │  │                 │  │           │
└─────────────┘  └─────────────────┘  └───────────┘
```

## 迁移和实现策略

### 阶段一：基础架构与设计

1. **Mastra API 服务模块开发** - ⏳ 计划中
   - 创建独立的 Node.js API 服务，提供 RESTful 和 WebSocket 接口
   - 实现智能体管理、工作流执行、知识库和模型调用 API
   - 集成 Mastra Core APIs 和 AI SDK 模型路由
   - 设计健壮的错误处理和日志记录机制
   - 开发服务发现和健康检查端点

2. **前端通信层实现** - ⏳ 计划中
   - 使用 axios 实现 HTTP 通信客户端
   - 集成 Socket.io 客户端处理流式响应
   - 创建 React 钩子简化智能体交互
   - 实现请求重试和断线重连机制
   - 添加请求缓存和状态同步

3. **Tauri 应用集成** - ⏳ 计划中
   - 开发 Tauri 应用打包和分发流程
   - 实现 API 服务的自动启动和关闭
   - 创建本地配置管理机制
   - 设计应用更新和版本控制系统
   - 实现本地文件系统访问接口

## 组件与功能对应关系

| LobeChat功能 | Mastra实现方式 | 状态 |
|-------------|---------------|------|
| 思维链(CoT) | Mastra API 服务的工作流端点 | ⏳ 计划中 |
| 分支对话 | 对话历史 API 和前端状态管理 | ⏳ 计划中 |
| 白板(Artifacts) | 集成 canvas API 和文件存储服务 | ⏳ 计划中 |
| 文件上传/知识库 | Mastra RAG API 和文件处理服务 | ⏳ 计划中 |
| 多AI服务商 | API 服务中的模型路由管理 | ⏳ 计划中 |
| 本地大语言模型 | API 服务中的 Ollama/vLLM 集成 | ⏳ 计划中 |
| 视觉识别 | 多模态模型 API 端点 | ⏳ 计划中 |
| 语音会话 | TTS/STT API 服务集成 | ⏳ 计划中 |
| 文生图 | 图像生成 API 端点 | ⏳ 计划中 |
| 插件系统 | 工具注册和调用 API | ⏳ 计划中 |
| 助手市场 | 模板库 API 和共享机制 | ⏳ 计划中 |
| **API 服务** | **独立 Node.js 服务** | ⏳ 计划中 |
| **WebSocket 流式响应** | **Socket.io 服务集成** | ⏳ 计划中 |
| **性能监控** | **API 服务遥测和指标收集** | ⏳ 计划中 |

## 总结

本 MXS 计划通过创建独立的 Mastra API 服务模块，实现了前端与 Mastra 核心功能之间的直接 HTTP/WebSocket 通信，不再依赖 Tauri 作为中间桥接层。这种架构设计带来了以下优势：

1. **解耦前后端**: 前端和 Mastra 服务可以独立开发和部署
2. **通信标准化**: 使用标准的 HTTP/WebSocket 协议简化了集成
3. **可扩展性**: API 服务可以独立扩展以处理更多请求
4. **跨平台支持**: 相同的 API 可以服务于桌面、Web 和移动应用
5. **开发便利性**: 前端开发者可以通过明确的 API 接口与智能体交互

通过 Tauri 应用自动启动和管理 API 服务，我们保留了桌面应用的便利性，同时获得了更灵活的架构。随着项目发展，我们可以轻松将同一套 API 服务部署到云端，实现无缝的本地/云端体验切换。
