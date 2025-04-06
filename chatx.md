# Lumos Studio Chat Session 优化方案

## 当前问题分析

分析当前 `src` 目录中的聊天会话实现，我发现以下几个关键问题：

1. **职责分散**：聊天会话相关功能分布在多个服务中，包括 `services/session.ts`、`services/chat.ts` 和 `api/mastra.ts`，导致功能重叠和代码冗余
2. **类型定义重复**：在 `services/types.ts`、`api/types.ts` 和其他地方存在重复的 Message 和 Session 类型定义
3. **状态管理混乱**：没有明确的状态管理策略，混合使用本地存储、内存缓存和API调用
4. **错误处理不一致**：不同组件有不同的错误处理方式，导致用户体验不一致
5. **会话ID生成混乱**：部分使用UUID，部分使用时间戳，导致ID格式不一致
6. **流式响应处理复杂**：在多个地方实现了流式响应解析逻辑，代码重复且容易出错
7. **多智能体支持不完善**：当前实现中，每个会话只绑定一个智能体，缺乏在同一会话中使用多个智能体的能力
8. **智能体切换不灵活**：用户无法在会话中动态切换智能体，需要创建新会话

## Chatbox 参考实现的优点

分析 Chatbox 的实现，发现以下值得借鉴的设计：

1. **统一的状态管理**：使用 Jotai 进行集中式的状态管理
2. **清晰的会话操作API**：在 `sessionActions.ts` 中定义了全面且一致的会话操作函数
3. **明确的类型定义**：在 `shared/types.ts` 中统一定义核心类型
4. **高内聚的模块设计**：相关功能集中在同一个模块，减少跨模块依赖
5. **高效的会话生成机制**：流式响应和增量更新的处理更加高效和统一
6. **一致的错误处理**：统一的错误捕获和展示机制

## 多智能体会话增强方案

### 1. 扩展会话模型支持多智能体

改进当前会话模型，使其能够支持多个智能体在同一会话中交互：

```typescript
// types/chat.ts
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  // 新增：消息所属的智能体ID
  agentId?: string;
  // 新增：智能体名称，用于显示
  agentName?: string;
  // 新增：智能体头像
  agentAvatar?: string;
  images?: string[]; // 可选的图片支持
  generating?: boolean; // 是否正在生成
  error?: string; // 错误信息
}

export interface Session {
  id: string;
  title: string;
  // 主要智能体ID（默认使用）
  defaultAgentId: string;
  // 会话中的所有智能体IDs
  agentIds: string[];
  // 每个智能体的上下文设置
  agentContexts?: Record<string, {
    systemPrompt?: string;
    modelSettings?: any;
  }>;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  tags?: string[];
}
```

### 2. 智能体管理扩展

为会话操作API添加智能体管理功能：

```typescript
// stores/sessionActions.ts

// 向会话中添加智能体
export function addAgentToSession(sessionId: string, agentId: string): void {
  const store = getDefaultStore();
  store.set(atoms.sessionsAtom, (sessions) =>
    sessions.map((s) => {
      if (s.id === sessionId) {
        // 避免重复添加相同的智能体
        if (!s.agentIds.includes(agentId)) {
          return {
            ...s,
            agentIds: [...s.agentIds, agentId],
          };
        }
      }
      return s;
    })
  );
  Storage.saveSession(getSession(sessionId));
}

// 从会话中移除智能体
export function removeAgentFromSession(sessionId: string, agentId: string): void {
  const store = getDefaultStore();
  const session = getSession(sessionId);
  
  // 不允许移除默认智能体
  if (session && session.defaultAgentId === agentId) {
    console.warn('Cannot remove default agent from session');
    return;
  }
  
  store.set(atoms.sessionsAtom, (sessions) =>
    sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          agentIds: s.agentIds.filter(id => id !== agentId),
        };
      }
      return s;
    })
  );
  Storage.saveSession(getSession(sessionId));
}

// 设置会话的默认智能体
export function setSessionDefaultAgent(sessionId: string, agentId: string): void {
  const store = getDefaultStore();
  const session = getSession(sessionId);
  
  // 确保智能体在会话中
  if (session && !session.agentIds.includes(agentId)) {
    // 自动添加智能体
    addAgentToSession(sessionId, agentId);
  }
  
  store.set(atoms.sessionsAtom, (sessions) =>
    sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          defaultAgentId: agentId,
        };
      }
      return s;
    })
  );
  Storage.saveSession(getSession(sessionId));
}
```

### 3. 改进消息发送和响应生成

支持指定智能体发送消息：

```typescript
// services/chat.ts

// 发送消息并指定响应的智能体
export async function sendMessageToAgent(
  sessionId: string,
  content: string,
  agentId?: string,
  onUpdate?: (content: string) => void,
) {
  const store = getDefaultStore();
  const session = getSession(sessionId);
  if (!session) return;
  
  // 如果未指定智能体，使用会话默认智能体
  const targetAgentId = agentId || session.defaultAgentId;
  
  // 添加用户消息
  const userMessage = addMessage(sessionId, {
    role: 'user',
    content,
    // 不需要给用户消息指定agentId
  });
  
  // 获取智能体信息
  const agent = await MastraAPI.getAgent(targetAgentId);
  
  // 创建助手消息
  const assistantMessage = addMessage(sessionId, {
    role: 'assistant',
    content: '',
    agentId: targetAgentId,
    agentName: agent?.name || '助手',
    agentAvatar: agent?.avatar,
    generating: true,
  });
  
  try {
    // 构建上下文消息 - 只包含当前会话中与目标智能体相关的消息或无特定智能体的消息
    const contextMessages = session.messages
      .filter(m => m.id !== assistantMessage.id)
      .filter(m => !m.agentId || m.agentId === targetAgentId || m.role === 'user')
      .map(m => ({
        role: m.role,
        content: m.content
      }));
    
    // 添加系统提示
    const systemPrompt = session.agentContexts?.[targetAgentId]?.systemPrompt;
    if (systemPrompt) {
      contextMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }
    
    let accumulatedText = '';
    
    // 使用MastraAPI的流式生成
    for await (const chunk of MastraAPI.streamGenerate(targetAgentId, {
      messages: contextMessages,
    })) {
      accumulatedText += chunk;
      
      // 更新消息内容
      updateMessage(sessionId, assistantMessage.id, {
        ...assistantMessage,
        content: accumulatedText,
      });
      
      if (onUpdate) {
        onUpdate(accumulatedText);
      }
    }
    
    // 完成生成
    updateMessage(sessionId, assistantMessage.id, {
      ...assistantMessage,
      content: accumulatedText,
      generating: false,
    });
    
  } catch (error) {
    // 统一错误处理
    updateMessage(sessionId, assistantMessage.id, {
      ...assistantMessage,
      content: assistantMessage.content || '',
      generating: false,
      error: error instanceof Error ? error.message : '生成失败',
    });
  }
}
```

### 4. 多智能体会话UI组件

创建智能体选择器组件，允许用户在会话中切换智能体：

```typescript
// components/AgentSelector.tsx
import React, { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import * as atoms from '../stores/atoms';
import * as sessionActions from '../stores/sessionActions';
import * as MastraAPI from '../api/mastra';

interface AgentSelectorProps {
  sessionId: string;
  onAgentChange?: (agentId: string) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ 
  sessionId, 
  onAgentChange 
}) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = useAtomValue(atoms.currentSessionAtom);
  
  // 加载可用智能体
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true);
        const allAgents = await MastraAPI.getAllAgents();
        setAgents(allAgents);
      } catch (error) {
        console.error('Failed to load agents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAgents();
  }, []);
  
  // 切换默认智能体
  const handleAgentChange = (agentId: string) => {
    sessionActions.setSessionDefaultAgent(sessionId, agentId);
    if (onAgentChange) {
      onAgentChange(agentId);
    }
  };
  
  // 添加智能体到会话
  const handleAddAgent = (agentId: string) => {
    sessionActions.addAgentToSession(sessionId, agentId);
  };
  
  // 从会话中移除智能体
  const handleRemoveAgent = (agentId: string) => {
    sessionActions.removeAgentFromSession(sessionId, agentId);
  };
  
  return (
    <div className="agent-selector">
      <div className="current-agent">
        {session?.defaultAgentId && (
          <div className="flex items-center">
            <span>当前智能体: </span>
            <select 
              value={session.defaultAgentId}
              onChange={(e) => handleAgentChange(e.target.value)}
              className="ml-2 p-1 border rounded"
            >
              {session.agentIds.map(agentId => {
                const agent = agents.find(a => a.id === agentId);
                return (
                  <option key={agentId} value={agentId}>
                    {agent?.name || agentId}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>
      
      <div className="available-agents mt-4">
        <h4 className="text-sm font-medium">可用智能体</h4>
        {loading ? (
          <p className="text-sm">加载中...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {agents.map(agent => (
              <div 
                key={agent.id} 
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm truncate">{agent.name}</span>
                {session?.agentIds.includes(agent.id) ? (
                  <button
                    onClick={() => handleRemoveAgent(agent.id)}
                    disabled={session.defaultAgentId === agent.id}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                  >
                    移除
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddAgent(agent.id)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                  >
                    添加
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5. 智能体上下文管理

添加管理智能体特定上下文的功能：

```typescript
// stores/sessionActions.ts

// 设置智能体系统提示
export function setAgentSystemPrompt(sessionId: string, agentId: string, prompt: string): void {
  const store = getDefaultStore();
  store.set(atoms.sessionsAtom, (sessions) =>
    sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          agentContexts: {
            ...s.agentContexts,
            [agentId]: {
              ...s.agentContexts?.[agentId],
              systemPrompt: prompt,
            },
          },
        };
      }
      return s;
    })
  );
  Storage.saveSession(getSession(sessionId));
}

// 设置智能体模型设置
export function setAgentModelSettings(sessionId: string, agentId: string, settings: any): void {
  const store = getDefaultStore();
  store.set(atoms.sessionsAtom, (sessions) =>
    sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          agentContexts: {
            ...s.agentContexts,
            [agentId]: {
              ...s.agentContexts?.[agentId],
              modelSettings: settings,
            },
          },
        };
      }
      return s;
    })
  );
  Storage.saveSession(getSession(sessionId));
}
```

### 6. 多智能体消息展示组件

增强消息显示组件，支持多智能体标识：

```typescript
// components/Message.tsx
import React from 'react';
import { Message as MessageType } from '../types/chat';
import { Markdown } from './Markdown';

interface MessageProps {
  message: MessageType;
  isLatest?: boolean;
}

export const Message: React.FC<MessageProps> = ({ 
  message, 
  isLatest 
}) => {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      id={`message-${message.id}`}
    >
      <div 
        className={`max-w-3/4 rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-100 text-blue-900' 
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {!isUser && message.agentName && (
          <div className="flex items-center mb-2">
            {message.agentAvatar ? (
              <img 
                src={message.agentAvatar} 
                alt={message.agentName}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
            )}
            <span className="text-xs font-medium text-gray-500">
              {message.agentName}
            </span>
          </div>
        )}
        
        <Markdown content={message.content} />
        
        {message.generating && (
          <div className="mt-2 text-xs text-gray-500">
            正在生成...
          </div>
        )}
        
        {message.error && (
          <div className="mt-2 text-xs text-red-500">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
};
```

## 优化方案总结

### 1. 统一类型定义

```typescript
// types/chat.ts 完善版
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  images?: string[];
  generating?: boolean;
  error?: string;
}

export interface Session {
  id: string;
  title: string;
  defaultAgentId: string;
  agentIds: string[];
  agentContexts?: Record<string, {
    systemPrompt?: string;
    modelSettings?: any;
  }>;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  tags?: string[];
}
```

### 2. 重构状态管理

采用 Jotai 进行集中状态管理：

```typescript
// stores/atoms.ts
import { atom } from 'jotai';
import { Session } from '../types/chat';

// 所有会话的原子状态
export const sessionsAtom = atom<Session[]>([]);

// 当前活跃会话ID的原子状态
export const currentSessionIdAtom = atom<string | null>(null);

// 派生的当前活跃会话状态
export const currentSessionAtom = atom(
  (get) => {
    const sessionId = get(currentSessionIdAtom);
    const sessions = get(sessionsAtom);
    return sessions.find((s) => s.id === sessionId) || null;
  }
);

// 当前会话消息的派生状态
export const currentMessagesAtom = atom(
  (get) => {
    const session = get(currentSessionAtom);
    return session?.messages || [];
  }
);

// 当前会话默认智能体ID
export const currentDefaultAgentIdAtom = atom(
  (get) => {
    const session = get(currentSessionAtom);
    return session?.defaultAgentId || null;
  }
);

// 当前会话所有智能体IDs
export const currentAgentIdsAtom = atom(
  (get) => {
    const session = get(currentSessionAtom);
    return session?.agentIds || [];
  }
);
```

### 3. 统一会话操作API

创建一个包含所有会话操作的统一API，添加多智能体支持：

```typescript
// stores/sessionActions.ts
import { getDefaultStore } from 'jotai';
import { v4 as uuid } from 'uuid';
import * as atoms from './atoms';
import { Message, Session } from '../types/chat';
import * as Storage from '../services/storage';
import * as MastraAPI from '../api/mastra';

// 创建新会话
export function createSession(agentId: string, title: string = '新会话'): Session {
  const store = getDefaultStore();
  const newSession: Session = {
    id: uuid(),
    title,
    defaultAgentId: agentId,
    agentIds: [agentId],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    agentContexts: {},
  };
  
  store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession]);
  setActiveSession(newSession.id);
  Storage.saveSession(newSession);
  
  return newSession;
}

// 创建多智能体会话
export function createMultiAgentSession(agentIds: string[], title: string = '多智能体对话'): Session {
  if (!agentIds.length) {
    throw new Error('至少需要一个智能体');
  }
  
  const store = getDefaultStore();
  const newSession: Session = {
    id: uuid(),
    title,
    defaultAgentId: agentIds[0],
    agentIds: [...agentIds],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    agentContexts: {},
  };
  
  store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession]);
  setActiveSession(newSession.id);
  Storage.saveSession(newSession);
  
  return newSession;
}

// 其他会话操作实现...
```

## 实施步骤

1. **统一类型定义**：创建 `types/chat.ts` 并移除重复定义，添加多智能体支持
2. **实现状态管理**：升级 `stores/atoms.ts` 和 `stores/sessionActions.ts` 支持多智能体
3. **服务层优化**：重构 `services/chat.ts` 支持智能体特定消息处理
4. **组件开发**：创建智能体选择器、多智能体消息显示组件
5. **消息交互改进**：实现智能体切换、添加、删除功能
6. **上下文管理**：为每个智能体添加独立的系统提示和设置
7. **会话分析**：添加多智能体会话统计和分析功能
8. **迁移现有代码**：逐步迁移现有功能到新架构
9. **测试与验证**：确保所有多智能体功能正常工作

## 预期收益

1. **更灵活的交互体验**：用户可以在同一会话中与多个智能体交互
2. **专业领域协作**：可以组合不同专业领域的智能体共同解决问题
3. **智能体对比**：用户可以对比不同智能体对同一问题的回答
4. **上下文个性化**：为每个智能体提供独立的上下文和设置
5. **代码更简洁**：统一多智能体处理逻辑，减少重复代码
6. **性能更高效**：优化状态管理和数据流转
7. **用户体验更一致**：统一的错误处理和状态反馈
8. **开发效率提升**：明确的API和架构可以提高开发效率 