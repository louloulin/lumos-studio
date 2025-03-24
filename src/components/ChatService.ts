// ChatService.ts - 聊天服务的数据管理

import { v4 as uuidv4 } from 'uuid';

// 对话节点类型
export interface ChatNode {
  id: string;
  text: string;
  role: 'user' | 'assistant';
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

// 聊天服务类
class ChatService {
  // 内存中存储所有会话
  private sessions: Map<string, ChatSession> = new Map();

  // 获取会话列表
  async getSessions(): Promise<ChatSession[]> {
    try {
      // 这里应当连接到持久化存储，如localStorage或远程API
      // 示例实现使用内存存储
      return Array.from(this.sessions.values()).sort((a, b) => 
        b.lastUpdated.getTime() - a.lastUpdated.getTime()
      );
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw new Error('获取会话列表失败');
    }
  }

  // 获取特定会话
  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      // 从存储中获取会话
      return this.sessions.get(sessionId) || null;
    } catch (error) {
      console.error(`Failed to get session ${sessionId}:`, error);
      throw new Error('获取会话失败');
    }
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

  // 删除会话
  async deleteSession(sessionId: string): Promise<void> {
    try {
      this.sessions.delete(sessionId);
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      throw new Error('删除会话失败');
    }
  }

  // 添加用户消息到当前会话节点
  async addUserMessage(
    sessionId: string, 
    text: string
  ): Promise<ChatNode> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      // 查找当前节点
      const currentNode = this.findNodeById(session.rootNode, session.currentNodeId);
      if (!currentNode) {
        throw new Error('当前对话节点不存在');
      }

      // 创建新用户消息节点
      const newNode: ChatNode = {
        id: uuidv4(),
        text,
        role: 'user',
        timestamp: new Date(),
        children: [],
        parentId: currentNode.id
      };

      // 将新节点添加到当前节点的子节点列表
      currentNode.children.push(newNode);

      // 更新当前节点指针和最后更新时间
      session.currentNodeId = newNode.id;
      session.lastUpdated = new Date();

      return newNode;
    } catch (error) {
      console.error(`Failed to add user message to session ${sessionId}:`, error);
      throw new Error('添加用户消息失败');
    }
  }

  // 添加智能体响应到当前会话节点
  async addAssistantResponse(
    sessionId: string, 
    text: string
  ): Promise<ChatNode> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      // 查找当前节点
      const currentNode = this.findNodeById(session.rootNode, session.currentNodeId);
      if (!currentNode) {
        throw new Error('当前对话节点不存在');
      }

      // 创建新的助手消息节点
      const newNode: ChatNode = {
        id: uuidv4(),
        text,
        role: 'assistant',
        timestamp: new Date(),
        children: [],
        parentId: currentNode.id
      };

      // 将新节点添加到当前节点的子节点列表
      currentNode.children.push(newNode);

      // 更新当前节点指针和最后更新时间
      session.currentNodeId = newNode.id;
      session.lastUpdated = new Date();

      return newNode;
    } catch (error) {
      console.error(`Failed to add assistant response to session ${sessionId}:`, error);
      throw new Error('添加智能体响应失败');
    }
  }

  // 创建新的对话分支
  async createBranch(
    sessionId: string, 
    parentNodeId: string
  ): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      // 查找父节点
      const parentNode = this.findNodeById(session.rootNode, parentNodeId);
      if (!parentNode) {
        throw new Error('父节点不存在');
      }

      // 创建分支标识节点
      const branchNode: ChatNode = {
        id: uuidv4(),
        text: `分支自: ${parentNode.text.substring(0, 20)}${parentNode.text.length > 20 ? '...' : ''}`,
        role: 'assistant',
        timestamp: new Date(),
        children: [],
        parentId: parentNode.id
      };

      // 将分支节点添加到父节点的子节点列表
      parentNode.children.push(branchNode);

      // 更新当前节点指针和最后更新时间
      session.currentNodeId = branchNode.id;
      session.lastUpdated = new Date();

      return branchNode.id;
    } catch (error) {
      console.error(`Failed to create branch in session ${sessionId}:`, error);
      throw new Error('创建分支失败');
    }
  }

  // 切换到特定节点
  async switchToNode(
    sessionId: string, 
    nodeId: string
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      // 验证节点存在
      const node = this.findNodeById(session.rootNode, nodeId);
      if (!node) {
        throw new Error('节点不存在');
      }

      // 更新当前节点指针
      session.currentNodeId = nodeId;
      session.lastUpdated = new Date();
    } catch (error) {
      console.error(`Failed to switch to node in session ${sessionId}:`, error);
      throw new Error('切换节点失败');
    }
  }

  // 删除分支
  async deleteBranch(
    sessionId: string, 
    nodeId: string
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('会话不存在');
      }

      // 不能删除根节点
      if (nodeId === session.rootNode.id) {
        throw new Error('不能删除根节点');
      }

      // 查找目标节点的父节点
      const parentNode = this.findParentNode(session.rootNode, nodeId);
      if (!parentNode) {
        throw new Error('无法找到父节点');
      }

      // 从父节点的子节点列表中删除目标节点
      const index = parentNode.children.findIndex(child => child.id === nodeId);
      if (index !== -1) {
        parentNode.children.splice(index, 1);
      }

      // 如果当前节点是被删除的节点或其子节点，则切换到父节点
      if (this.isNodeOrDescendant(nodeId, session.currentNodeId, session.rootNode)) {
        session.currentNodeId = parentNode.id;
      }

      session.lastUpdated = new Date();
    } catch (error) {
      console.error(`Failed to delete branch in session ${sessionId}:`, error);
      throw new Error('删除分支失败');
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

  // 辅助方法: 根据ID查找节点
  private findNodeById(root: ChatNode, nodeId: string): ChatNode | null {
    if (root.id === nodeId) {
      return root;
    }

    for (const child of root.children) {
      const found = this.findNodeById(child, nodeId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  // 辅助方法: 查找节点的父节点
  private findParentNode(root: ChatNode, nodeId: string): ChatNode | null {
    for (const child of root.children) {
      if (child.id === nodeId) {
        return root;
      }
      
      const found = this.findParentNode(child, nodeId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  // 辅助方法: 检查特定节点是否是另一节点的祖先节点
  private isNodeOrDescendant(
    targetNodeId: string, 
    currentNodeId: string, 
    root: ChatNode
  ): boolean {
    if (targetNodeId === currentNodeId) {
      return true;
    }

    const currentNode = this.findNodeById(root, currentNodeId);
    if (!currentNode) {
      return false;
    }

    if (currentNode.parentId === null) {
      return false;
    }

    // 递归检查父节点
    return this.isNodeOrDescendant(
      targetNodeId, 
      currentNode.parentId, 
      root
    );
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
}

// 导出单例实例
export const chatService = new ChatService();
export default chatService; 