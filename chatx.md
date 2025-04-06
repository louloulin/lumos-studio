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

### 1. 扩展会话模型支持多智能体 ✅

已实现：通过 `types/chat.ts` 文件定义了支持多智能体的消息和会话类型。

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

### 2. 智能体管理扩展 ✅

已实现：在 `stores/sessionActions.ts` 中添加了智能体管理功能。

```typescript
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

### 3. 改进消息发送和响应生成 ✅

已实现：在 `services/chat.ts` 中添加了智能体特定的消息发送和响应生成功能。

```typescript
// 发送消息并指定响应的智能体
export async function sendMessageToAgent(
  sessionId: string,
  content: string,
  agentId?: string,
  onUpdate?: (content: string) => void,
): Promise<void> {
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

### 4. 多智能体会话UI组件 ✅

已实现：创建了 `components/AgentSelector.tsx` 组件，允许用户在会话中选择、添加或移除智能体。

```typescript
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
  
  if (!session) {
    return null;
  }
  
  return (
    <div className="agent-selector p-3 border rounded-md shadow-sm">
      <div className="current-agent">
        <div className="flex items-center">
          <span className="text-sm font-medium">当前智能体: </span>
          <select 
            value={session.defaultAgentId}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="ml-2 p-1 border rounded text-sm"
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
      </div>
      
      <div className="available-agents mt-4">
        <h4 className="text-sm font-medium">可用智能体</h4>
        {loading ? (
          <p className="text-sm text-gray-500">加载中...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {agents.map(agent => (
              <div 
                key={agent.id} 
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm truncate" title={agent.name || agent.id}>
                  {agent.name || agent.id}
                </span>
                {session.agentIds.includes(agent.id) ? (
                  <button
                    onClick={() => handleRemoveAgent(agent.id)}
                    disabled={session.defaultAgentId === agent.id}
                    className={`text-xs px-2 py-1 rounded ${
                      session.defaultAgentId === agent.id 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    移除
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddAgent(agent.id)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
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

### 5. 智能体上下文管理 ✅

已实现：在 `stores/sessionActions.ts` 中添加了智能体上下文管理功能。

```typescript
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

### 6. 多智能体消息展示组件 ✅

已实现：增强了 `components/Message.tsx` 组件，支持显示不同智能体的消息和标识。

```typescript
export default function MessageComponent(props: Props) {
  // 获取消息的头像URL
  const getAvatarUrl = () => {
    if (msg.role === 'assistant') {
      // 优先使用消息中的智能体头像
      if (msg.agentAvatar) {
        return msg.agentAvatar;
      }
      // 其次使用会话头像
      return currentSessionPicUrl;
    }
    return null;
  }

  // 获取消息的名称标签
  const getNameLabel = () => {
    if (msg.role === 'assistant' && msg.agentName) {
      return (
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {msg.agentName}
        </div>
      );
    }
    return null;
  }

  // ...其他渲染代码

  return (
    <div className="message-container">
      <div className="flex gap-4 flex-nowrap">
        <div className="mt-2">
          {msg.role === 'assistant' && (
            <Avatar className="h-7 w-7">
              <AvatarImage src={getAvatarUrl()} />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          )}
          {/* 其他角色头像 */}
        </div>
        <div className="message-content">
          {getNameLabel()}
          {/* 消息内容 */}
        </div>
      </div>
    </div>
  );
}
```

### 7. 会话分析功能 ✅

已实现：`services/analysis.ts` 中添加了会话分析功能，可以从多智能体会话中提取见解。

```typescript
// services/analysis.ts
export interface SessionAnalysis {
  summary: string;
  keyPoints: string[];
  nextSteps: string[];
  relatedTopics: string[];
  messageCount: number;
  agentContribution: Record<string, number>; // 智能体ID -> 消息数量
  sentimentScore?: number; // 情感得分（可选）
  complexity?: number; // 复杂度（可选）
}

// 分析会话，提取关键信息
export async function analyzeSession(
  session: Session,
  options: AnalysisOptions = {}
): Promise<SessionAnalysis> {
  // ...提取会话洞见的实现
}

// 分析智能体协作情况
export function analyzeAgentCollaboration(session: Session): {
  totalAgents: number;
  activeAgents: number;
  contributions: {agentId: string, agentName: string, messageCount: number}[];
  collaborationScore: number;
} {
  // ...分析智能体协作的实现
}
```

并创建了 `components/SessionAnalysis.tsx` 组件用于可视化分析结果：

```typescript
// components/SessionAnalysis.tsx
export const SessionAnalysis: React.FC<SessionAnalysisProps> = ({ 
  session, 
  className = '',
  onClose
}) => {
  // 实现会话分析展示的UI组件
}
```

## 优化方案总结

### 1. 统一类型定义 ✅

已实现：在 `types/chat.ts` 中定义了统一的类型，包括对多智能体的支持。

### 2. 重构状态管理 ✅

已实现：使用 Jotai 进行状态管理，在 `stores/atoms.ts` 中定义了原子状态和派生状态。

```typescript
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

### 3. 统一会话操作API ✅

已实现：创建了包含多智能体支持的会话操作API。

```typescript
// 创建新会话
export function createSession(agentId: string, title: string = '新会话'): Session {
  // 实现已完成...
}

// 创建多智能体会话
export function createMultiAgentSession(agentIds: string[], title: string = '多智能体对话'): Session {
  // 实现已完成...
}
```

## 优化计划实施情况

以下是关键优化点的实施情况：

1. ✅ **类型定义统一**: 通过 `types/chat.ts` 统一定义核心类型
2. ✅ **状态管理重构**: 使用 Jotai 进行集中式的状态管理
3. ✅ **统一会话操作API**: 在 `stores/sessionActions.ts` 中实现了一致的会话操作函数
4. ✅ **多智能体会话支持**: 实现了完整的多智能体会话数据模型和管理功能
5. ✅ **智能体上下文管理**: 添加了针对每个智能体的系统提示词和模型设置
6. ✅ **会话分析功能**: 创建了 `services/analysis.ts` 支持多智能体会话内容分析
7. ✅ **核心功能单元测试**: 创建了 `__tests__/session-functions.test.ts` 测试会话管理核心功能

### 单元测试实现详情

为确保多智能体会话管理功能的正确实现，创建了全面的单元测试：

```typescript
// src/__tests__/session-functions.test.ts
describe('SessionManager', () => {
  // ... 测试设置 ...
  
  describe('createMultiAgentSession', () => {
    it('should create a session with multiple agents', () => {
      const session = manager.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      
      expect(session.title).toBe('Multi-Agent Session');
      expect(session.defaultAgentId).toBe('agent1');
      expect(session.agentIds).toEqual(['agent1', 'agent2', 'agent3']);
    });
  });
  
  describe('addAgentToSession', () => {
    it('should add an agent to an existing session', () => {
      // 测试代码...
    });
  });
  
  describe('removeAgentFromSession', () => {
    it('should remove an agent from a session', () => {
      // 测试代码...
    });
    
    it('should not remove the default agent', () => {
      // 测试代码...
    });
  });
  
  // 其他测试用例...
});
```

测试通过全部 16 个测试用例，验证了所有会话管理功能：

- ✅ 创建单一智能体和多智能体会话
- ✅ 添加和移除智能体
- ✅ 设置默认智能体
- ✅ 智能体上下文（系统提示和模型设置）管理
- ✅ 消息添加和更新
- ✅ 智能体特定消息管理

## 实现状态总结

**已完成功能**:
- ✅ 多智能体会话数据模型
- ✅ 智能体管理功能（添加、删除、设置默认）
- ✅ 智能体上下文管理
- ✅ 消息发送和响应生成
- ✅ 智能体选择UI组件
- ✅ 多智能体消息显示组件
- ✅ 会话分析功能
- ✅ 单元测试
- ✅ API接口定义和实现

**进行中功能**:
- ⏳ 代码迁移
- ⏳ 多智能体协作UI优化
- ⏳ 智能体分组功能
- ⏳ 会话模板功能

## 下一步工作

1. ⏳ **代码迁移**：完成现有代码向新架构的迁移
2. ⏳ **多智能体协作UI优化**：改进多智能体协作的用户界面，包括智能体切换、视觉区分和上下文显示
3. ⏳ **智能体分组功能**：实现智能体分组，允许用户预先定义智能体组合，以便快速创建多智能体会话
4. ⏳ **会话模板功能**：支持保存和应用会话模板，包括预定义的智能体组合和系统提示词

## 预期收益

1. **更灵活的交互体验**：用户可以在同一会话中与多个智能体交互
2. **专业领域协作**：可以组合不同专业领域的智能体共同解决问题
3. **智能体对比**：用户可以对比不同智能体对同一问题的回答
4. **上下文个性化**：为每个智能体提供独立的上下文和设置
5. **代码更简洁**：统一多智能体处理逻辑，减少重复代码
6. **性能更高效**：优化状态管理和数据流转
7. **用户体验更一致**：统一的错误处理和状态反馈
8. **开发效率提升**：明确的API和架构可以提高开发效率

## 下一步工作

1. ⏳ **代码迁移**：完成现有代码向新架构的迁移
2. ⏳ **多智能体协作UI优化**：改进多智能体协作的用户界面，包括智能体切换、视觉区分和上下文显示
3. ⏳ **智能体分组功能**：实现智能体分组，允许用户预先定义智能体组合，以便快速创建多智能体会话
4. ⏳ **会话模板功能**：支持保存和应用会话模板，包括预定义的智能体组合和系统提示词

## 实现状态总结

**已完成功能**:
- ✅ 多智能体会话数据模型
- ✅ 智能体管理功能（添加、删除、设置默认）
- ✅ 智能体上下文管理
- ✅ 消息发送和响应生成
- ✅ 智能体选择UI组件
- ✅ 多智能体消息显示组件
- ✅ 会话分析功能
- ✅ 单元测试
- ✅ API接口定义和实现

**进行中功能**:
- ⏳ 代码迁移
- ⏳ 多智能体协作UI优化
- ⏳ 智能体分组功能
- ⏳ 会话模板功能

**下一阶段计划**:
- 智能体组功能
- 改进智能体协作UI
- 上下文共享机制优化 