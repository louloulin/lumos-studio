// ChatService.ts - 聊天服务的数据管理

import { v4 as uuidv4 } from 'uuid';

// 对话节点类型
export interface ChatNode {
  id: string;
  text: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  children: ChatNode[];
  parentId: string | null;
}

// 会话类型
export interface ChatSession {
  id: string;
  name: string;
  agentId: string;
  rootNode: ChatNode;
  currentNodeId: string;
  lastUpdated: Date;
  pinned?: boolean;
}

class ChatService {
  // 内存中存储所有会话
  private sessions: Map<string, ChatSession> = new Map();

  // 获取会话
  async getSession(sessionId: string): Promise<ChatSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      // 如果会话不存在，创建一个新会话
      return this.createSession(`会话 ${new Date().toLocaleString()}`, 'generalAssistant');
    }
    return session;
  }

  // 获取所有会话
  async getSessions(): Promise<ChatSession[]> {
    return Array.from(this.sessions.values());
  }

  // 创建新会话
  async createSession(name: string, agentId: string): Promise<ChatSession> {
    try {
      // 创建根节点
      const rootNode: ChatNode = {
        id: uuidv4(),
        text: '开始对话',
        role: 'assistant',
        timestamp: new Date(),
        children: [],
        parentId: null
      };

      // 创建会话
      const session: ChatSession = {
        id: uuidv4(),
        name,
        agentId,
        rootNode,
        currentNodeId: rootNode.id,
        lastUpdated: new Date()
      };

      // 保存会话
      this.sessions.set(session.id, session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('创建会话失败');
    }
  }

  // 添加用户消息
  async addUserMessage(
    sessionId: string, 
    text: string
  ): Promise<ChatNode> {
    try {
      const session = await this.getSession(sessionId);

      // 创建用户消息节点
      const userNode: ChatNode = {
        id: uuidv4(),
        text,
        role: 'user',
        timestamp: new Date(),
        children: [],
        parentId: session.currentNodeId
      };

      // 找到父节点并添加子节点
      const parentNode = this.findNodeById(session.rootNode, session.currentNodeId);
      if (parentNode) {
        parentNode.children.push(userNode);
      }

      // 更新当前节点和会话的最后更新时间
      session.currentNodeId = userNode.id;
      session.lastUpdated = new Date();

      return userNode;
    } catch (error) {
      console.error(`Failed to add user message to session ${sessionId}:`, error);
      throw new Error('添加用户消息失败');
    }
  }

  // 添加助手响应
  async addAssistantResponse(
    sessionId: string, 
    text: string
  ): Promise<ChatNode> {
    try {
      const session = await this.getSession(sessionId);

      // 创建助手消息节点
      const assistantNode: ChatNode = {
        id: uuidv4(),
        text,
        role: 'assistant',
        timestamp: new Date(),
        children: [],
        parentId: session.currentNodeId
      };

      // 找到父节点并添加子节点
      const parentNode = this.findNodeById(session.rootNode, session.currentNodeId);
      if (parentNode) {
        parentNode.children.push(assistantNode);
      }

      // 更新当前节点和会话的最后更新时间
      session.currentNodeId = assistantNode.id;
      session.lastUpdated = new Date();

      return assistantNode;
    } catch (error) {
      console.error(`Failed to add assistant response to session ${sessionId}:`, error);
      throw new Error('添加助手响应失败');
    }
  }

  // 更新节点
  async updateNode(
    sessionId: string, 
    nodeId: string, 
    text: string
  ): Promise<ChatNode> {
    try {
      const session = await this.getSession(sessionId);

      // 找到节点
      const node = this.findNodeById(session.rootNode, nodeId);
      if (!node) {
        throw new Error('节点不存在');
      }

      // 更新节点内容
      node.text = text;

      // 更新会话的最后更新时间
      session.lastUpdated = new Date();

      return node;
    } catch (error) {
      console.error(`Failed to update node ${nodeId} in session ${sessionId}:`, error);
      throw new Error('更新节点失败');
    }
  }

  // 切换到指定节点
  async switchToNode(
    sessionId: string, 
    nodeId: string
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);

      // 验证节点存在
      const node = this.findNodeById(session.rootNode, nodeId);
      if (!node) {
        throw new Error('节点不存在');
      }

      // 更新当前节点
      session.currentNodeId = nodeId;
      session.lastUpdated = new Date();
    } catch (error) {
      console.error(`Failed to switch to node ${nodeId} in session ${sessionId}:`, error);
      throw new Error('切换节点失败');
    }
  }

  // 获取对话历史
  async getChatHistory(
    sessionId: string, 
    limit: number = 50
  ): Promise<ChatNode[]> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      // 获取从当前节点到根节点的路径
      return this.getPathToRoot(session.rootNode, session.currentNodeId, limit);
    } catch (error) {
      console.error(`Failed to get chat history for session ${sessionId}:`, error);
      throw new Error('获取对话历史失败');
    }
  }

  // 获取对话树完整数据
  async getChatTree(sessionId: string): Promise<ChatNode | null> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      return session.rootNode;
    } catch (error) {
      console.error(`Failed to get chat tree for session ${sessionId}:`, error);
      throw new Error('获取对话树失败');
    }
  }

  // 从指定节点创建分支
  async createBranchFromNode(
    sessionId: string, 
    nodeId: string
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);

      // 验证节点存在
      const node = this.findNodeById(session.rootNode, nodeId);
      if (!node) {
        throw new Error('节点不存在');
      }

      // 更新当前节点
      session.currentNodeId = nodeId;
      session.lastUpdated = new Date();
    } catch (error) {
      console.error(`Failed to create branch from node ${nodeId} in session ${sessionId}:`, error);
      throw new Error('创建分支失败');
    }
  }

  // 删除分支
  async deleteBranch(
    sessionId: string, 
    nodeId: string
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);

      // 不能删除根节点
      if (nodeId === session.rootNode.id) {
        throw new Error('不能删除根节点');
      }

      // 找到父节点
      const node = this.findNodeById(session.rootNode, nodeId);
      if (!node || !node.parentId) {
        throw new Error('节点不存在或没有父节点');
      }

      const parentNode = this.findNodeById(session.rootNode, node.parentId);
      if (!parentNode) {
        throw new Error('父节点不存在');
      }

      // 从父节点的子节点列表中移除
      parentNode.children = parentNode.children.filter(child => child.id !== nodeId);

      // 如果当前节点是被删除的节点或其子节点，切换到父节点
      if (this.isNodeInSubtree(node, session.currentNodeId)) {
        session.currentNodeId = node.parentId;
      }

      // 更新会话的最后更新时间
      session.lastUpdated = new Date();
    } catch (error) {
      console.error(`Failed to delete branch ${nodeId} in session ${sessionId}:`, error);
      throw new Error('删除分支失败');
    }
  }

  // 辅助方法: 在树中查找节点
  private findNodeById(root: ChatNode, id: string): ChatNode | null {
    if (root.id === id) {
      return root;
    }

    for (const child of root.children) {
      const found = this.findNodeById(child, id);
      if (found) {
        return found;
      }
    }

    return null;
  }

  // 辅助方法: 获取从指定节点到根节点的路径
  private getPathToRoot(
    root: ChatNode, 
    nodeId: string, 
    limit: number
  ): ChatNode[] {
    const path: ChatNode[] = [];
    
    // 查找节点
    const node = this.findNodeById(root, nodeId);
    if (!node) {
      return path;
    }

    // 添加当前节点
    path.push(node);

    // 从当前节点向上追踪到根节点
    let currentId = node.parentId;
    while (currentId && path.length < limit) {
      const parent = this.findNodeById(root, currentId);
      if (!parent) {
        break;
      }
      
      path.push(parent);
      currentId = parent.parentId;
    }

    // 反转数组，使其按时间顺序排列
    return path.reverse();
  }

  // 辅助方法: 检查节点是否在子树中
  private isNodeInSubtree(root: ChatNode, nodeId: string): boolean {
    if (root.id === nodeId) {
      return true;
    }

    for (const child of root.children) {
      if (this.isNodeInSubtree(child, nodeId)) {
        return true;
      }
    }

    return false;
  }
}

// 单例实例
export const chatService = new ChatService(); 