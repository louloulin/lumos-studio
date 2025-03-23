# MXS 计划：基于 Mastra 构建 LobeChat 风格的智能体工作室

## 项目概述

本项目旨在创建一个基于 Mastra 框架的智能体工作室，借鉴 LobeChat 的用户体验和界面设计，打造一个现代化、易用且功能丰富的 AI 智能体开发和部署平台。该平台将允许用户创建、测试和部署各种智能体，支持多种模型服务商和丰富的功能特性。

### 技术栈
- **框架**: Mastra 作为智能体开发框架
- **前端**: React + Tailwind CSS + Shadcn UI
- **状态管理**: Jotai
- **部署**: 支持本地部署和云端服务

## 迁移和实现策略

### 阶段一：基础架构与设计

1. **Mastra 框架整合** - ⏳ 计划中
   - 移除现有的 AI 模型路由实现，使用 Mastra 的模型路由（基于 AI SDK）
   - 创建基于 Mastra 的智能体核心类，支持记忆和工具调用
   - 集成 Mastra 的工作流和评估功能 ✅

2. **LobeChat 风格 UI 实现** - ✅ 部分完成
   - 实现分支对话界面，支持对话历史管理
   - 设计智能体工作室主界面，包括侧边栏和主内容区 ✅
   - 创建符合 LobeChat 风格的暗色/亮色主题 ✅

3. **数据存储与管理** - ⏳ 计划中
   - 支持本地/云端数据存储选项
   - 实现智能体配置、对话历史和用户首选项的持久化
   - 设计数据导入/导出功能

### 阶段二：核心功能实现

1. **智能体创建与管理** - ✅ 部分完成
   - 智能体模板库，包含预配置的角色和功能 ✅
   - 智能体自定义界面，支持指令调整和参数配置 ✅
   - 智能体组织和分类系统 ⏳

2. **对话与交互系统** - ✅ 部分完成
   - 支持文本、图像、语音多模态输入 ✅ 部分完成
   - 实现思维链(CoT)可视化 ✅
   - 支持智能体工具调用的交互界面 ✅

3. **多模型服务商集成** - ✅ 部分完成
   - 支持 OpenAI、Anthropic Claude、Google Gemini 等 ✅
   - 整合本地模型支持（Ollama、LM Studio）⏳
   - 模型切换和对比功能 ⏳

4. **高级特性** - ✅ 部分完成
   - 白板功能(Artifacts) ⏳
   - 知识库与文件上传 ✅
   - 插件系统，支持工具调用 ✅

### 阶段三：优化与扩展

1. **性能优化** - ⏳ 计划中
   - 流式响应优化
   - 大型会话历史处理
   - 资源使用优化

2. **用户体验改进** - ✅ 部分完成
   - 响应式设计，适配移动设备 ✅
   - 渐进式Web应用(PWA)支持 ⏳
   - 自定义主题和界面调整 ✅

3. **企业级功能** - ⏳ 计划中
   - 多用户身份验证和管理
   - 团队协作功能
   - 使用量统计和报告

## 功能特性规划

### 智能体开发功能
1. **可视化智能体编辑器** - ✅ 完成
   - 直观的智能体配置界面
   - 指令和提示词工程工具
   - 可视化工作流构建器 ✅

2. **智能体测试环境** - ⏳ 计划中
   - 内置评估工具和指标
   - A/B测试不同智能体版本
   - 性能分析和改进建议

3. **智能体部署选项** - ⏳ 计划中
   - 一键部署到生产环境
   - 版本控制和回滚功能
   - 导出为独立应用或API

### 对话和交互功能
1. **高级会话管理** - ✅ 部分完成
   - 分支对话树，支持探索不同路径 ⏳
   - 会话历史搜索和筛选 ✅
   - 会话导出和分享功能 ⏳

2. **多模态支持** - ✅ 部分完成
   - 文字、图像、语音输入 ✅ 部分完成
   - 图表和可视化输出 ⏳
   - 文档和PDF处理能力 ⏳

3. **工具集成** - ✅ 部分完成
   - 网络搜索和信息检索 ✅
   - 代码执行和沙箱环境 ⏳
   - 第三方API集成框架 ⏳

### 知识管理功能
1. **知识库构建** - ✅ 部分完成
   - 文件上传和自动索引 ✅
   - 向量存储集成 ⏳
   - 知识来源追踪和引用 ⏳

2. **RAG增强** - ⏳ 计划中
   - 上下文优化检索
   - 混合检索策略
   - 动态知识库更新

## 技术实现参考

### Mastra整合示例
```typescript
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

// 创建智能体
const agent = new Agent({
  name: 'CustomerSupportAgent',
  instructions: '你是一位客户支持专家，提供友好专业的帮助...',
  model: openai('gpt-4-turbo'),
  memory: new Memory(),
  tools: [searchKnowledgeBase, createTicket]
});

// 使用智能体
export async function handleCustomerQuery(query: string) {
  const result = await agent.generate(query);
  return result;
}
```

### LobeChat风格UI示例
```tsx
<div className="flex h-screen bg-background">
  {/* 侧边栏 */}
  <div className="w-64 border-r border-border">
    <div className="p-4">
      <h1 className="text-xl font-bold">智能体工作室</h1>
    </div>
    <div className="space-y-1 p-2">
      {agents.map(agent => (
        <div 
          key={agent.id} 
          className={cn(
            "flex items-center p-2 rounded-md cursor-pointer",
            selectedAgent?.id === agent.id ? "bg-primary/10" : "hover:bg-muted"
          )}
          onClick={() => selectAgent(agent)}
        >
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={agent.avatar} />
            <AvatarFallback>{agent.name[0]}</AvatarFallback>
          </Avatar>
          <div className="truncate">{agent.name}</div>
        </div>
      ))}
    </div>
    <Button className="w-full mt-4" onClick={createNewAgent}>
      <Plus className="mr-2 h-4 w-4" /> 新建智能体
    </Button>
  </div>

  {/* 主内容区 */}
  <div className="flex-1 flex flex-col">
    {/* 对话历史 */}
    <div className="flex-1 overflow-auto p-4">
      {messages.map(message => (
        <div 
          key={message.id} 
          className={cn(
            "mb-4 p-3 rounded-lg max-w-3xl",
            message.role === 'user' 
              ? "ml-auto bg-primary text-primary-foreground" 
              : "bg-muted"
          )}
        >
          {message.content}
        </div>
      ))}
    </div>

    {/* 输入区域 */}
    <div className="p-4 border-t border-border">
      <div className="flex">
        <Input 
          className="flex-1 mr-2" 
          placeholder="输入消息..." 
          value={input} 
          onChange={e => setInput(e.target.value)} 
        />
        <Button onClick={sendMessage}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</div>
```

## 组件与功能对应关系

| LobeChat功能 | Mastra实现方式 | 状态 |
|-------------|---------------|------|
| 思维链(CoT) | Mastra工作流+前端可视化 | ✅ 已完成 |
| 分支对话 | 自定义会话状态管理 | ⏳ 计划中 |
| 白板(Artifacts) | 集成canvas绘图功能 | ⏳ 计划中 |
| 文件上传/知识库 | Mastra RAG + 向量存储 | ✅ 部分完成 |
| 多AI服务商 | AI SDK模型路由 | ✅ 已完成 |
| 本地大语言模型 | Ollama/vLLM集成 | ⏳ 计划中 |
| 视觉识别 | 多模态模型支持 | ✅ 部分完成 |
| 语音会话 | 集成TTS和STT功能 | ⏳ 计划中 |
| 文生图 | 图像生成模型集成 | ⏳ 计划中 |
| 插件系统 | Mastra工具调用 | ✅ 部分完成 |
| 助手市场 | 智能体模板库 | ✅ 已完成 |

## 迁移路线图

### 第1季度：基础架构 - ✅ 部分完成
- 搭建基于Mastra的核心智能体框架 ✅
- 实现基本UI组件和布局 ✅
- 建立本地数据存储系统 ⏳

### 第2季度：核心功能 - ✅ 部分完成
- 开发智能体创建和配置界面 ✅
- 实现基础对话功能和历史管理 ✅
- 集成初始模型提供商(OpenAI、Claude) ✅

### 第3季度：高级功能 - ✅ 部分完成
- 添加文件上传和知识库功能 ✅
- 实现工具调用和插件系统 ✅
- 开发智能体市场和分享功能 ✅

### 第4季度：优化和扩展 - ⏳ 计划中
- 完善移动体验和PWA功能
- 添加团队协作功能
- 发布稳定版本

## 总结

本MXS计划将借鉴LobeChat优秀的用户体验和界面设计，结合Mastra强大的智能体开发框架，打造一个完整的智能体工作室解决方案。通过系统性的迁移和开发，我们将实现一个功能丰富、用户友好且技术先进的平台，支持从简单聊天机器人到复杂工作流智能体的各种AI应用场景。

项目将遵循渐进式开发，优先实现核心功能，然后逐步添加高级特性，确保每个阶段都能提供实用的功能。最终目标是创建一个既适合AI爱好者使用，又能满足专业开发者需求的智能体开发平台。

## 已完成的组件 (2023年6月更新)
- ✅ 智能体编辑器 (AgentEditor.tsx): 全功能的智能体配置界面，支持系统指令、模型选择和工具配置
- ✅ 智能体市场 (AgentMarket.tsx): 预配置智能体的浏览和安装界面
- ✅ 设置页面 (SettingsPage.tsx): 完整的应用设置界面，包括API配置、外观设置和其他选项
- ✅ 工作区 (Workspace.tsx): 主应用布局，整合各个组件并提供导航功能
- ✅ 工作流构建器 (WorkflowBuilder.tsx): 可视化工作流设计工具，支持导出Mastra工作流代码
- ✅ 支持响应式设计，适配桌面和移动设备
- ✅ 深色/浅色主题支持
