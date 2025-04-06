import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';

// Mock all imports before using them
// Mock the @/shared/defaults import
vi.mock('@/shared/defaults', () => ({
  settings: () => ({}),
  getDefaultPrompt: () => 'You are a helpful assistant.',
}));

// Define the types needed for mocks - use types compatible with types/chat.ts
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
}

interface Session {
  id: string;
  title: string;
  defaultAgentId: string;
  agentIds: string[];
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  agentContexts?: Record<string, any>;
}

// Mock the services
const mockSessions: Session[] = [];
const mockSetSessionId = vi.fn();

// Define mock implementations before vi.mock calls
// Create a mock implementation of sessionActions
const mockGetSession = (id: string): Session | null => {
  return mockSessions.find(s => s.id === id) || null;
};

const mockSessionCreator = (agentId: string, title: string): Session => ({
  id: 'mock-id',
  title,
  defaultAgentId: agentId,
  agentIds: [agentId],
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  agentContexts: {}
});

const mockMultiAgentSessionCreator = (agentIds: string[], title: string): Session => {
  if (!agentIds.length) {
    throw new Error('至少需要一个智能体');
  }
  return {
    id: 'mock-id',
    title,
    defaultAgentId: agentIds[0],
    agentIds: [...agentIds],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    agentContexts: {}
  };
};

const mockAddAgentToSession = (sessionId: string, agentId: string): void => {
  const session = mockGetSession(sessionId);
  if (session && !session.agentIds.includes(agentId)) {
    session.agentIds.push(agentId);
  }
};

const mockRemoveAgentFromSession = (sessionId: string, agentId: string): void => {
  const session = mockGetSession(sessionId);
  if (session && session.defaultAgentId !== agentId) {
    session.agentIds = session.agentIds.filter(id => id !== agentId);
  }
};

const mockSetSessionDefaultAgent = (sessionId: string, agentId: string): void => {
  const session = mockGetSession(sessionId);
  if (session) {
    if (!session.agentIds.includes(agentId)) {
      session.agentIds.push(agentId);
    }
    session.defaultAgentId = agentId;
  }
};

const mockSetAgentSystemPrompt = (sessionId: string, agentId: string, prompt: string): void => {
  const session = mockGetSession(sessionId);
  if (session) {
    if (!session.agentContexts) {
      session.agentContexts = {};
    }
    if (!session.agentContexts[agentId]) {
      session.agentContexts[agentId] = {};
    }
    session.agentContexts[agentId].systemPrompt = prompt;
  }
};

const mockSetAgentModelSettings = (sessionId: string, agentId: string, settings: any): void => {
  const session = mockGetSession(sessionId);
  if (session) {
    if (!session.agentContexts) {
      session.agentContexts = {};
    }
    if (!session.agentContexts[agentId]) {
      session.agentContexts[agentId] = {};
    }
    session.agentContexts[agentId].modelSettings = settings;
  }
};

const mockAddMessage = (sessionId: string, messageData: Partial<Message>): Message => {
  const session = mockGetSession(sessionId);
  const message: Message = {
    id: 'message-id',
    role: messageData.role || 'user',
    content: messageData.content || '',
    createdAt: Date.now(),
    ...messageData
  };
  
  if (session) {
    session.messages.push(message);
    return message;
  }
  return message;
};

const mockGetMessage = (sessionId: string, messageId: string): Message | undefined => {
  const session = mockGetSession(sessionId);
  if (!session) return undefined;
  return session.messages.find(m => m.id === messageId);
};

const mockUpdateMessage = (sessionId: string, messageId: string, updates: Partial<Message>): void => {
  const session = mockGetSession(sessionId);
  if (session) {
    session.messages = session.messages.map(m => 
      m.id === messageId ? { ...m, ...updates } : m
    );
  }
};

// Mock atoms module
vi.mock('../stores/atoms', () => {
  return {
    sessionsAtom: { init: [] },
    currentSessionIdAtom: { init: null }
  };
});

// Mock Storage module
vi.mock('../services/storage', () => ({
  saveSession: vi.fn(),
  saveMultipleSessions: vi.fn(), // Changed from saveSessions to saveMultipleSessions
  deleteSession: vi.fn(() => true),
  setActiveSessionId: vi.fn(),
  getActiveSessionId: vi.fn(() => null),
  getSessions: vi.fn(() => []),
}));

// Mock sessionActions with our implementations
vi.mock('../stores/sessionActions', () => ({
  createSession: mockSessionCreator,
  createMultiAgentSession: mockMultiAgentSessionCreator,
  getSession: mockGetSession,
  addAgentToSession: mockAddAgentToSession,
  removeAgentFromSession: mockRemoveAgentFromSession,
  setSessionDefaultAgent: mockSetSessionDefaultAgent,
  setAgentSystemPrompt: mockSetAgentSystemPrompt,
  setAgentModelSettings: mockSetAgentModelSettings,
  addMessage: mockAddMessage,
  getMessage: mockGetMessage,
  updateMessage: mockUpdateMessage,
  sendMessageToAgent: vi.fn(),
  sendMessageToMultipleAgents: vi.fn()
}));

// Import after mocking
import * as atoms from '../stores/atoms';
import * as sessionActions from '../stores/sessionActions';
import * as Storage from '../services/storage';

// Test suite
describe('sessionActions', () => {
  beforeEach(() => {
    // Reset mocks and test data
    mockSessions.length = 0;
    vi.clearAllMocks();
  });
  
  describe('createSession', () => {
    it('should create a new session with a single agent', () => {
      const session = sessionActions.createSession('agent1', 'Test Session');
      
      expect(session).toMatchObject({
        title: 'Test Session',
        defaultAgentId: 'agent1',
        agentIds: ['agent1'],
        messages: [],
      });
      
      // Add session to our mock for getSession
      mockSessions.push(session);
      
      // Check if storage was updated
      expect(Storage.saveSession).toHaveBeenCalled();
      expect(Storage.setActiveSessionId).toHaveBeenCalled();
    });
  });
  
  describe('createMultiAgentSession', () => {
    it('should create a session with multiple agents', () => {
      const session = sessionActions.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      
      expect(session).toMatchObject({
        title: 'Multi-Agent Session',
        defaultAgentId: 'agent1',
        agentIds: ['agent1', 'agent2', 'agent3'],
        messages: [],
      });
      
      // Add session to our mock for getSession
      mockSessions.push(session);
      
      // Check if storage was updated
      expect(Storage.saveSession).toHaveBeenCalled();
      expect(Storage.setActiveSessionId).toHaveBeenCalled();
    });
    
    it('should throw an error if no agents are provided', () => {
      expect(() => sessionActions.createMultiAgentSession([])).toThrow('至少需要一个智能体');
    });
  });
  
  describe('addAgentToSession', () => {
    it('should add an agent to an existing session', () => {
      // Create a session first
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      // Add a new agent
      sessionActions.addAgentToSession(session.id, 'agent2');
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      expect(updatedSession?.agentIds).toContain('agent1');
      expect(updatedSession?.agentIds).toContain('agent2');
      expect(updatedSession?.agentIds.length).toBe(2);
      
      // Check if storage was updated
      expect(Storage.saveSession).toHaveBeenCalled();
    });
  });
  
  describe('removeAgentFromSession', () => {
    it('should remove an agent from a session', () => {
      // Create a multi-agent session
      const session = sessionActions.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      mockSessions.push(session);
      
      // Remove one agent
      sessionActions.removeAgentFromSession(session.id, 'agent3');
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      expect(updatedSession?.agentIds).toContain('agent1');
      expect(updatedSession?.agentIds).toContain('agent2');
      expect(updatedSession?.agentIds).not.toContain('agent3');
      expect(updatedSession?.agentIds.length).toBe(2);
    });
    
    it('should not remove the default agent', () => {
      // Create a multi-agent session
      const session = sessionActions.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      mockSessions.push(session);
      
      // Try to remove the default agent
      sessionActions.removeAgentFromSession(session.id, 'agent1');
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      // Default agent should still be there
      expect(updatedSession?.agentIds).toContain('agent1');
      expect(updatedSession?.agentIds.length).toBe(3);
    });
  });
  
  describe('setSessionDefaultAgent', () => {
    it('should change the default agent', () => {
      // Create a multi-agent session
      const session = sessionActions.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      mockSessions.push(session);
      
      // Change default agent
      sessionActions.setSessionDefaultAgent(session.id, 'agent2');
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      expect(updatedSession?.defaultAgentId).toBe('agent2');
    });
    
    it('should add agent if not already in the session', () => {
      // Create a session
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      // Set a new agent as default
      sessionActions.setSessionDefaultAgent(session.id, 'agent2');
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      expect(updatedSession?.defaultAgentId).toBe('agent2');
      expect(updatedSession?.agentIds).toContain('agent1');
      expect(updatedSession?.agentIds).toContain('agent2');
      expect(updatedSession?.agentIds.length).toBe(2);
    });
  });
  
  describe('setAgentSystemPrompt', () => {
    it('should set system prompt for an agent', () => {
      // Create a session
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      // Set system prompt
      sessionActions.setAgentSystemPrompt(session.id, 'agent1', 'You are a helpful assistant');
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      expect(updatedSession?.agentContexts?.agent1?.systemPrompt).toBe('You are a helpful assistant');
    });
  });
  
  describe('setAgentModelSettings', () => {
    it('should set model settings for an agent in a session', () => {
      // Create a session first
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      // Set model settings
      const settings = { temperature: 0.7, maxTokens: 2000 };
      sessionActions.setAgentModelSettings(session.id, 'agent1', settings);
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      expect(updatedSession?.agentContexts?.['agent1']?.modelSettings).toEqual(settings);
      
      // Check if storage was updated
      expect(Storage.saveSession).toHaveBeenCalled();
    });
  });
  
  describe('addMessage', () => {
    it('should add a message with agent information', () => {
      // Create a session
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      // Add a message with agent info
      const message = sessionActions.addMessage(session.id, {
        role: 'assistant',
        content: 'Hello, I am an AI assistant',
        agentId: 'agent1',
        agentName: 'AI Assistant',
      });
      
      // Get the updated session
      const updatedSession = sessionActions.getSession(session.id);
      
      expect(updatedSession?.messages.length).toBe(1);
      expect(updatedSession?.messages[0].content).toBe('Hello, I am an AI assistant');
      expect(updatedSession?.messages[0].agentId).toBe('agent1');
      expect(updatedSession?.messages[0].agentName).toBe('AI Assistant');
    });
  });

  describe('getMessage', () => {
    it('should retrieve a specific message from a session', () => {
      // Create a session first
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      // Add a message
      const message = sessionActions.addMessage(session.id, {
        role: 'user', 
        content: 'Hello'
      });
      
      // Get the message
      const retrievedMessage = sessionActions.getMessage(session.id, message.id);
      
      expect(retrievedMessage).toBeDefined();
      expect(retrievedMessage?.content).toBe('Hello');
    });
    
    it('should return undefined if the session does not exist', () => {
      const retrievedMessage = sessionActions.getMessage('non-existent', 'message-id');
      expect(retrievedMessage).toBeUndefined();
    });
    
    it('should return undefined if the message does not exist', () => {
      // Create a session first
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      const retrievedMessage = sessionActions.getMessage(session.id, 'non-existent');
      expect(retrievedMessage).toBeUndefined();
    });
  });

  describe('updateMessage', () => {
    it('should update a message in a session', () => {
      // Create a session first
      const session = sessionActions.createSession('agent1', 'Test Session');
      mockSessions.push(session);
      
      // Add a message
      const message = sessionActions.addMessage(session.id, {
        role: 'user', 
        content: 'Hello'
      });
      
      // Update the message
      sessionActions.updateMessage(session.id, message.id, {
        content: 'Updated content'
      });
      
      // Get the updated message
      const updatedMessage = sessionActions.getMessage(session.id, message.id);
      
      expect(updatedMessage?.content).toBe('Updated content');
      expect(Storage.saveSession).toHaveBeenCalled();
    });
  });

  describe('sendMessageToMultipleAgents', () => {
    it('should be able to send a message to multiple agents', async () => {
      // Create a multi-agent session
      const session = sessionActions.createMultiAgentSession(
        ['agent1', 'agent2', 'agent3'], 
        'Multi-Agent Session'
      );
      mockSessions.push(session);
      
      // Spy on the sendMessageToAgent function
      const sendMessageSpy = vi.spyOn(sessionActions, 'sendMessageToAgent');
      
      // Send message to multiple agents
      await sessionActions.sendMessageToMultipleAgents(
        session.id,
        'Hello all agents',
        ['agent1', 'agent2']
      );
      
      // Check if sendMessageToAgent was called for each agent
      expect(sendMessageSpy).toHaveBeenCalledTimes(2);
      expect(sendMessageSpy).toHaveBeenCalledWith(
        session.id, 'Hello all agents', 'agent1', expect.any(Function)
      );
      expect(sendMessageSpy).toHaveBeenCalledWith(
        session.id, 'Hello all agents', 'agent2', expect.any(Function)
      );
    });
  });
}); 