import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Session, Message } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory implementation for tests
class TestStorage {
  private sessions: Record<string, Session> = {};
  private activeSessionId: string | null = null;
  
  saveSession(session: Session): void {
    this.sessions[session.id] = { ...session };
  }
  
  getSession(id: string): Session | null {
    return this.sessions[id] || null;
  }
  
  setActiveSessionId(id: string): void {
    this.activeSessionId = id;
  }
  
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }
  
  deleteSession(id: string): void {
    delete this.sessions[id];
  }
  
  getAllSessions(): Session[] {
    return Object.values(this.sessions);
  }
  
  clear(): void {
    this.sessions = {};
    this.activeSessionId = null;
  }
}

// Create SessionManager for testing
class SessionManager {
  private storage: TestStorage;
  
  constructor(storage: TestStorage) {
    this.storage = storage;
  }
  
  createSession(agentId: string, title: string = '新会话'): Session {
    const newSession: Session = {
      id: uuidv4(),
      title,
      defaultAgentId: agentId,
      agentIds: [agentId],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentContexts: {},
    };
    
    this.storage.saveSession(newSession);
    this.storage.setActiveSessionId(newSession.id);
    
    return newSession;
  }
  
  createMultiAgentSession(agentIds: string[], title: string = '多智能体对话'): Session {
    if (!agentIds.length) {
      throw new Error('至少需要一个智能体');
    }
    
    const newSession: Session = {
      id: uuidv4(),
      title,
      defaultAgentId: agentIds[0],
      agentIds: [...agentIds],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentContexts: {},
    };
    
    this.storage.saveSession(newSession);
    this.storage.setActiveSessionId(newSession.id);
    
    return newSession;
  }
  
  getSession(id: string): Session | null {
    return this.storage.getSession(id);
  }
  
  addAgentToSession(sessionId: string, agentId: string): void {
    const session = this.getSession(sessionId);
    if (session && !session.agentIds.includes(agentId)) {
      session.agentIds.push(agentId);
      session.updatedAt = Date.now();
      this.storage.saveSession(session);
    }
  }
  
  removeAgentFromSession(sessionId: string, agentId: string): void {
    const session = this.getSession(sessionId);
    if (session && session.defaultAgentId !== agentId) {
      session.agentIds = session.agentIds.filter(id => id !== agentId);
      session.updatedAt = Date.now();
      this.storage.saveSession(session);
    }
  }
  
  setSessionDefaultAgent(sessionId: string, agentId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      if (!session.agentIds.includes(agentId)) {
        session.agentIds.push(agentId);
      }
      session.defaultAgentId = agentId;
      session.updatedAt = Date.now();
      this.storage.saveSession(session);
    }
  }
  
  setAgentSystemPrompt(sessionId: string, agentId: string, prompt: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      if (!session.agentContexts) {
        session.agentContexts = {};
      }
      if (!session.agentContexts[agentId]) {
        session.agentContexts[agentId] = {};
      }
      session.agentContexts[agentId].systemPrompt = prompt;
      session.updatedAt = Date.now();
      this.storage.saveSession(session);
    }
  }
  
  setAgentModelSettings(sessionId: string, agentId: string, settings: any): void {
    const session = this.getSession(sessionId);
    if (session) {
      if (!session.agentContexts) {
        session.agentContexts = {};
      }
      if (!session.agentContexts[agentId]) {
        session.agentContexts[agentId] = {};
      }
      session.agentContexts[agentId].modelSettings = settings;
      session.updatedAt = Date.now();
      this.storage.saveSession(session);
    }
  }
  
  addMessage(sessionId: string, message: Omit<Message, 'id' | 'createdAt'>): Message {
    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    
    session.messages.push(newMessage);
    session.updatedAt = Date.now();
    this.storage.saveSession(session);
    
    return newMessage;
  }
  
  getMessage(sessionId: string, messageId: string): Message | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;
    
    return session.messages.find(m => m.id === messageId);
  }
  
  updateMessage(sessionId: string, messageId: string, updates: Partial<Message>): void {
    const session = this.getSession(sessionId);
    if (!session) return;
    
    session.messages = session.messages.map(m => 
      m.id === messageId ? { ...m, ...updates } : m
    );
    
    session.updatedAt = Date.now();
    this.storage.saveSession(session);
  }
}

describe('SessionManager', () => {
  let storage: TestStorage;
  let manager: SessionManager;
  
  beforeEach(() => {
    storage = new TestStorage();
    manager = new SessionManager(storage);
  });
  
  afterEach(() => {
    storage.clear();
  });
  
  describe('createSession', () => {
    it('should create a new session with a single agent', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      expect(session.title).toBe('Test Session');
      expect(session.defaultAgentId).toBe('agent1');
      expect(session.agentIds).toEqual(['agent1']);
      expect(session.messages).toEqual([]);
      
      const storedSession = storage.getSession(session.id);
      expect(storedSession).not.toBeNull();
      expect(storage.getActiveSessionId()).toBe(session.id);
    });
  });
  
  describe('createMultiAgentSession', () => {
    it('should create a session with multiple agents', () => {
      const session = manager.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      
      expect(session.title).toBe('Multi-Agent Session');
      expect(session.defaultAgentId).toBe('agent1');
      expect(session.agentIds).toEqual(['agent1', 'agent2', 'agent3']);
      expect(session.messages).toEqual([]);
      
      const storedSession = storage.getSession(session.id);
      expect(storedSession).not.toBeNull();
    });
    
    it('should throw an error if no agents are provided', () => {
      expect(() => manager.createMultiAgentSession([])).toThrow('至少需要一个智能体');
    });
  });
  
  describe('addAgentToSession', () => {
    it('should add an agent to an existing session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      manager.addAgentToSession(session.id, 'agent2');
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.agentIds).toContain('agent1');
      expect(updatedSession?.agentIds).toContain('agent2');
      expect(updatedSession?.agentIds.length).toBe(2);
    });
    
    it('should not add an agent that is already in the session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      manager.addAgentToSession(session.id, 'agent1');
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.agentIds).toEqual(['agent1']);
      expect(updatedSession?.agentIds.length).toBe(1);
    });
  });
  
  describe('removeAgentFromSession', () => {
    it('should remove an agent from a session', () => {
      const session = manager.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      
      manager.removeAgentFromSession(session.id, 'agent3');
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.agentIds).toContain('agent1');
      expect(updatedSession?.agentIds).toContain('agent2');
      expect(updatedSession?.agentIds).not.toContain('agent3');
      expect(updatedSession?.agentIds.length).toBe(2);
    });
    
    it('should not remove the default agent', () => {
      const session = manager.createMultiAgentSession(
        ['agent1', 'agent2'], 
        'Multi-Agent Session'
      );
      
      manager.removeAgentFromSession(session.id, 'agent1');
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.agentIds).toContain('agent1');
      expect(updatedSession?.agentIds).toContain('agent2');
      expect(updatedSession?.agentIds.length).toBe(2);
    });
  });
  
  describe('setSessionDefaultAgent', () => {
    it('should change the default agent', () => {
      const session = manager.createMultiAgentSession(
        ['agent1', 'agent2'], 
        'Multi-Agent Session'
      );
      
      manager.setSessionDefaultAgent(session.id, 'agent2');
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.defaultAgentId).toBe('agent2');
    });
    
    it('should add the agent if not already in the session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      manager.setSessionDefaultAgent(session.id, 'agent3');
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.defaultAgentId).toBe('agent3');
      expect(updatedSession?.agentIds).toContain('agent3');
      expect(updatedSession?.agentIds.length).toBe(2);
    });
  });
  
  describe('setAgentSystemPrompt', () => {
    it('should set system prompt for an agent in a session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      manager.setAgentSystemPrompt(session.id, 'agent1', 'You are a helpful assistant.');
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.agentContexts?.['agent1']?.systemPrompt).toBe('You are a helpful assistant.');
    });
  });
  
  describe('setAgentModelSettings', () => {
    it('should set model settings for an agent in a session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      const settings = { temperature: 0.7, maxTokens: 2000 };
      manager.setAgentModelSettings(session.id, 'agent1', settings);
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.agentContexts?.['agent1']?.modelSettings).toEqual(settings);
    });
  });
  
  describe('addMessage', () => {
    it('should add a message to a session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      const message = manager.addMessage(session.id, {
        role: 'user',
        content: 'Hello',
      });
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.messages.length).toBe(1);
      expect(updatedSession?.messages[0].content).toBe('Hello');
      expect(updatedSession?.messages[0].role).toBe('user');
    });
    
    it('should add agent-specific message to a session', () => {
      const session = manager.createMultiAgentSession(['agent1', 'agent2'], 'Multi-Agent Session');
      
      const message = manager.addMessage(session.id, {
        role: 'assistant',
        content: 'Hello from agent2',
        agentId: 'agent2',
        agentName: 'Agent 2'
      });
      
      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.messages.length).toBe(1);
      expect(updatedSession?.messages[0].content).toBe('Hello from agent2');
      expect(updatedSession?.messages[0].agentId).toBe('agent2');
      expect(updatedSession?.messages[0].agentName).toBe('Agent 2');
    });
  });
  
  describe('getMessage', () => {
    it('should retrieve a specific message from a session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      const message = manager.addMessage(session.id, {
        role: 'user',
        content: 'Hello',
      });
      
      const retrievedMessage = manager.getMessage(session.id, message.id);
      
      expect(retrievedMessage).toBeDefined();
      expect(retrievedMessage?.content).toBe('Hello');
    });
    
    it('should return undefined if the message does not exist', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      const retrievedMessage = manager.getMessage(session.id, 'non-existent');
      
      expect(retrievedMessage).toBeUndefined();
    });
  });
  
  describe('updateMessage', () => {
    it('should update a message in a session', () => {
      const session = manager.createSession('agent1', 'Test Session');
      
      const message = manager.addMessage(session.id, {
        role: 'user',
        content: 'Hello',
      });
      
      manager.updateMessage(session.id, message.id, {
        content: 'Updated content',
      });
      
      const updatedMessage = manager.getMessage(session.id, message.id);
      
      expect(updatedMessage?.content).toBe('Updated content');
    });
  });
}); 