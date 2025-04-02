# LOX: Lumos-Studio 转型计划

本计划旨在将 Lumos-Studio 转型为基于 Mastra 能力的智能体平台，提供类似 LobeChat 的用户体验，但具有更强的扩展性和工具集成能力。

## 当前进度

### 基础架构优化

- [x] Mastra 集成升级 (2023-07-26)
  - 创建了 `src/services` 目录结构
  - 实现了 `MastraClient` 服务层，用于与 Mastra API 进行交互
  - 实现了 `ChatService` 服务层，用于处理聊天相关功能
  - 定义了核心类型系统，支持智能体、会话和消息管理

- [x] 聊天引擎重构 (2023-07-27)
  - 实现了 `StorageService` 本地存储服务，提供会话持久化功能
  - 实现了 `SessionService` 会话管理服务，整合聊天和存储功能
  - 创建了 React Hooks: `useSessions` 和 `useSession`，用于前端状态管理
  - 支持流式响应处理、会话历史管理、消息重新生成等功能

- [x] UI/UX 现代化 (2023-07-28)
  - 实现了主题系统与暗模式支持
  - 添加了 CSS 变量系统，统一管理主题色彩
  - 改进了主题切换功能，支持跟随系统、亮色和暗色模式
  - 添加了主题切换组件到界面中


### 智能体市场

- [ ] 智能体定义标准化
- [ ] 智能体创建界面
- [ ] 智能体市场展示

### 插件系统

- [ ] 插件架构设计
- [ ] 核心插件实现
- [ ] 插件市场

### 高级功能

- [ ] 多模态支持
- [ ] 工作流可视化
- [ ] 高级文档分析

### 用户体验优化

- [ ] 会话管理高级功能
- [ ] 响应式设计优化
- [ ] 部署与分发

## 实施计划

### 阶段一：基础架构优化（当前阶段）

1. **Mastra 集成升级** - 完成
   - 建立服务层架构
   - 实现 Mastra Client 封装
   - 实现消息流处理

2. **聊天引擎重构** - 完成
   - 基于 Mastra API 重构聊天引擎
   - 实现会话记忆系统
   - 优化流式响应处理

3. **UI/UX 现代化** - 完成
   - 重新设计布局系统
   - 实现主题与暗模式
   - 优化响应式界面

### 后续阶段

将按计划推进智能体市场、插件系统、高级功能和用户体验优化的开发工作。

## 技术架构

### 服务层设计

服务层将核心功能模块化，便于维护和扩展：

- `MastraService`: 封装 Mastra API 调用，提供智能体管理功能
- `ChatService`: 提供聊天相关功能，包括会话管理、消息处理等
- `SessionService`: 会话管理服务，整合聊天和存储功能
- `StorageService`: 本地存储服务，提供会话持久化功能
- `AgentService`: 智能体管理服务，将在智能体市场阶段实现
- `PluginService`: 插件管理服务，将在插件系统阶段实现

### 类型系统

建立了完整的类型定义，包括：

- `Agent`: 智能体定义
- `Message`: 消息类型
- `Session`: 会话定义
- `Tool`: 工具定义

### React Hooks

为前端组件提供状态管理和业务逻辑：

- `useSessions`: 提供会话列表管理、会话操作和消息处理功能
- `useSession`: 提供单个会话管理，用于会话详情页面
- `useAppTheme`: 提供主题管理功能，包括主题切换和状态获取

## 下一步工作

1. 开始智能体市场阶段的开发
2. 实现智能体定义标准化
3. 开发智能体创建和编辑界面

---

*更新日期: 2023-07-28*

## 1. 概述

LOX (Lumos-Studio Optimization eXperience) 计划旨在将现有的 Lumos-Studio 转化为一个基于 Mastra 的全功能 AI Agent 平台，参考 LobeChat 的优秀用户体验与功能特性，打造一个现代化、灵活且强大的智能体平台。

## 2. 现状分析

### 当前架构

基于对现有 Lumos-Studio 代码的分析，平台目前采用:
- React + TypeScript 前端架构
- Vite 作为构建工具
- 使用 Mastra API 进行基础 AI 交互
- 已实现基本聊天界面和代码块展示功能

### 功能差距

对比 LobeChat，主要的功能差距包括:
- 缺乏完整的智能体市场和管理系统
- 缺少插件架构
- 聊天功能尚未充分利用 Mastra 的高级特性
- 界面设计和用户体验有待提升
- 缺乏多模态和高级工具集成

## 3. 目标与愿景

构建一个基于 Mastra 的全功能 AI Agent 平台，具备:
- 现代化、直观的用户界面
- 完整的智能体市场与定制功能
- 可扩展的插件系统
- 多模态交互能力（语音、图像等）
- 高级工作流和知识库集成
- 优秀的性能与可靠性

## 4. 实施计划

### 阶段一：基础架构优化 (2-3周)

1. **Mastra 集成升级**
   - 采用 Mastra Client 替代直接 API 调用
   - 实现 Memory 系统集成用于会话持久化
   - 优化流式响应处理

   ```typescript
   // 使用 MastraClient 的示例代码
   import { MastraClient } from '@mastra/client-js';

   export const mastraClient = new MastraClient({
     baseUrl: process.env.NEXT_PUBLIC_MASTRA_API_URL || 'http://localhost:4111',
   });
   ```

2. **聊天引擎重构**
   - 使用 AI SDK 的 useChat hook 优化聊天交互
   - 改进流式文本处理和界面渲染
   - 重构消息组件，支持富媒体内容

   ```typescript
   import { useChat } from '@ai-sdk/react';

   function ChatComponent() {
     const { messages, input, handleInputChange, handleSubmit } = useChat({
       api: '/api/chat',
       experimental_prepareRequestBody({ messages, id }) {
         return { message: messages.at(-1), id };
       },
     });
     // 渲染聊天界面
   }
   ```

3. **UI/UX 现代化**
   - 重新设计布局和组件，参考 LobeChat 的用户体验
   - 优化移动端响应式设计
   - 实现主题系统，支持深色/浅色模式
   - 优化代码块和 markdown 渲染

### 阶段二：智能体市场构建 (3-4周)

1. **智能体定义标准化**
   - 设计智能体元数据结构
   - 创建智能体模板和分类系统
   - 实现智能体版本管理

   ```typescript
   interface Agent {
     id: string;
     name: string;
     avatar?: string;
     description: string;
     systemPrompt: string;
     category: string[];
     version: string;
     author: string;
     tools?: ToolDefinition[];
     parameters?: ParameterDefinition[];
   }
   ```

2. **智能体市场界面**
   - 开发智能体浏览和搜索页面
   - 实现智能体详情和预览功能
   - 添加智能体安装和更新机制
   - 支持智能体评分和评论系统

3. **智能体创建与定制**
   - 开发智能体编辑器
   - 支持系统提示词编辑
   - 添加工具和参数配置界面
   - 实现智能体导出和分享功能

### 阶段三：插件系统 (4-5周)

1. **插件架构设计**
   - 基于 Mastra 的工具调用设计插件接口
   - 实现插件生命周期管理
   - 构建插件安全沙箱机制
   - 设计插件元数据标准

   ```typescript
   // 插件注册示例
   mastra.registerPlugin({
     id: 'web-search',
     name: '网络搜索',
     description: '在网络上搜索信息',
     version: '1.0.0',
     onCall: async (query) => {
       // 执行搜索逻辑
       return searchResults;
     }
   });
   ```

2. **核心插件实现**
   - 网络搜索插件
   - 文件处理插件
   - 知识库查询插件
   - 代码分析与生成插件

3. **插件市场**
   - 开发插件浏览和搜索界面
   - 实现插件安装和配置流程
   - 添加插件版本管理
   - 支持插件评分和评论系统

### 阶段四：高级功能 (5-6周)

1. **多模态支持**
   - 集成 Mastra 的语音识别和合成功能
   - 添加图像处理与分析能力
   - 实现文件上传与知识库功能
   - 支持白板和协作工具

2. **工作流与思维链可视化**
   - 利用 Mastra 的工作流能力实现思维链
   - 开发工作流可视化界面
   - 实现工作流步骤调试和编辑
   - 添加工作流模板和分享功能

   ```typescript
   import { Step, Workflow } from "@mastra/core/workflows";
   import { z } from "zod";

   // 工作流示例
   const workflowSchema = z.object({
     insight: z.string(),
     nextSteps: z.array(z.string()),
   });

   const analyzeData = new Step({
     name: "analyzeData",
     description: "Analyze the provided data",
     schema: workflowSchema,
     execute: async ({ model, input }) => {
       // 工作流执行逻辑
     }
   });
   ```

3. **知识库与 RAG 集成**
   - 实现文档上传和处理
   - 集成 PgVector 或其他向量数据库
   - 添加知识库管理界面
   - 实现基于 RAG 的智能问答

   ```typescript
   // 向量查询工具示例
   const vectorQueryTool = createVectorQueryTool({
     id: 'vectorQueryTool',
     vectorStoreName: "pgVector",
     indexName: "embeddings",
     model: openai.embedding('text-embedding-3-small'),
     enableFilter: true,
   });
   ```

### 阶段五：用户体验优化与部署 (2-3周)

1. **性能优化**
   - 实现组件懒加载
   - 优化数据缓存策略
   - 改进代码分割
   - 添加性能监控

2. **多用户支持**
   - 设计用户认证和权限系统
   - 实现团队协作功能
   - 添加用户设置和偏好管理
   - 支持数据导入/导出

3. **一键部署解决方案**
   - 创建 Vercel 快速部署解决方案
   - 提供 Docker 容器化部署
   - 添加环境变量配置指南
   - 支持自定义域名设置

## 5. 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **状态管理**: Jotai
- **AI 框架**: Mastra + AI SDK
- **数据存储**: IndexedDB (本地) + 可选远程数据库
- **部署平台**: Vercel/Netlify/自托管

## 6. 成功指标

- **用户体验**: 流畅的交互和响应时间 (<200ms)
- **功能完整性**: 实现 LobeChat 的核心功能集
- **扩展性**: 支持 10+ 插件和 20+ 预定义智能体
- **性能**: Lighthouse 性能评分 >90
- **社区接受度**: GitHub Stars 和贡献者数量

## 7. 里程碑规划

| 里程碑 | 时间 | 主要交付物 |
|-------|------|-----------|
| 基础架构升级 | 第 1-3 周 | Mastra 集成, 聊天引擎重构, UI 现代化 |
| 智能体市场 Alpha | 第 4-7 周 | 智能体定义标准, 市场界面, 编辑功能 |
| 插件系统 Beta | 第 8-12 周 | 插件架构, 核心插件, 插件市场 |
| 高级功能集成 | 第 13-18 周 | 多模态支持, 工作流可视化, RAG 集成 |
| 优化与部署 | 第 19-21 周 | 性能优化, 多用户支持, 部署方案 |

## 8. 潜在挑战与对策

1. **Mastra 版本更新适配**
   - 建立版本兼容层
   - 定期跟踪 Mastra 更新
   - 实施自动化测试确保兼容性

2. **性能优化**
   - 实施流式响应优化
   - 合理使用缓存策略
   - 可视化渲染优化

3. **插件安全性**
   - 实现严格的权限模型
   - 沙箱环境执行插件代码
   - 安全审计和漏洞扫描

4. **多模态体验**
   - 渐进式加载策略
   - 合理的回退机制
   - 适应不同网络环境

## 9. 结论

LOX 项目将把 Lumos-Studio 提升为一个成熟的、基于 Mastra 的 AI Agent 平台，通过学习和借鉴 LobeChat 的成功经验，我们将构建一个具有现代化设计、丰富功能和良好扩展性的产品。通过充分利用 Mastra 的先进特性，我们将为用户提供一个强大、灵活且易用的 AI 交互平台。

---

**参考资料**:
- [LobeChat GitHub 仓库](https://github.com/lobehub/lobe-chat)
- [Mastra 文档](https://mastra.ai/)
- [AI SDK 文档](https://sdk.vercel.ai/docs)
