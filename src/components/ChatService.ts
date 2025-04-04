// ChatService.ts - 聊天服务的数据管理

// 会话类型
export interface ChatSession {
  id: string;
  name: string;
  agentId: string;
  lastMessage?: string;
  lastUpdated: Date;
  pinned?: boolean;
}

class ChatService {
  private sessions: ChatSession[] = [];
  private listeners: Array<() => void> = [];

  // 初始化一些示例会话
  constructor() {
    this.sessions = [
      {
        id: '1',
        name: '通用助手',
        agentId: 'gpt-4',
        lastMessage: '有什么我可以帮助你的？',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 5),
        pinned: true
      },
      {
        id: '2',
        name: '代码助手',
        agentId: 'code-assistant',
        lastMessage: '我可以帮助你解决编程问题。',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: '3',
        name: '创意写作',
        agentId: 'creative-writer',
        lastMessage: '让我们一起创作精彩的内容！',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    ];
  }

  // 创建新会话
  async createSession(name: string, agentId: string): Promise<ChatSession> {
    // 在实际应用中，这里应该调用后端API创建会话
    const session: ChatSession = {
      id: Date.now().toString(),
      name,
      agentId,
      lastUpdated: new Date()
    };
    
    this.sessions.unshift(session);
    this.notifyListeners();
    return session;
  }

  // 获取所有会话
  getSessions(): ChatSession[] {
    return [...this.sessions];
  }

  // 获取特定会话
  getSession(id: string): ChatSession | undefined {
    return this.sessions.find(s => s.id === id);
  }

  // 删除会话
  deleteSession(id: string): void {
    this.sessions = this.sessions.filter(s => s.id !== id);
    this.notifyListeners();
  }

  // 更新会话
  updateSession(id: string, updates: Partial<ChatSession>): void {
    this.sessions = this.sessions.map(session => 
      session.id === id ? { ...session, ...updates } : session
    );
    this.notifyListeners();
  }

  // 添加更新监听器
  addChangeListener(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// 创建单例实例
export const chatService = new ChatService(); 