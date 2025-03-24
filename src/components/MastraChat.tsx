import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { SendHorizontal, FileUp, RefreshCw, GitBranch, MoreVertical, Menu, Paintbrush2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ChatTree from './ChatTree';
import { chatService, ChatNode } from './ChatService';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import ArtifactsTab from './ArtifactsTab';

// 定义组件属性
interface MastraChatProps {
  sessionId: string;
  agentId: string;
}

// 定义消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  image?: string;
}

// 定义智能体类型
interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
}

// 主聊天组件
const MastraChat: React.FC<MastraChatProps> = ({ sessionId, agentId }) => {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showBranchView, setShowBranchView] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [chatTree, setChatTree] = useState<ChatNode | null>(null);
  const { toast } = useToast();
  const [showArtifacts, setShowArtifacts] = useState(false);
  
  // 模拟从API获取智能体信息
  useEffect(() => {
    // 这里应当替换为实际的API调用，用于获取智能体数据
    const fetchAgent = async () => {
      try {
        // 模拟API响应
        const mockAgent: Agent = {
          id: agentId,
          name: agentId === 'gpt-4' ? '通用助手' : 
                agentId === 'code-assistant' ? '代码助手' : 
                agentId === 'creative-writer' ? '创意写作' : 
                '智能助手',
          description: '我是一个智能助手，可以回答您的问题和提供帮助。',
          avatar: undefined
        };
        
        setSelectedAgent(mockAgent);
      } catch (error) {
        console.error('Error fetching agent:', error);
        toast({
          title: '获取智能体信息失败',
          description: '无法加载智能体数据，请稍后再试。',
          variant: 'destructive',
        });
      }
    };
    
    fetchAgent();
  }, [agentId, toast]);
  
  // 获取对话历史
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        // 从聊天服务获取会话数据
        const session = await chatService.getSession(sessionId);
        
        if (!session) {
          // 如果会话不存在，创建新会话
          await chatService.createSession(
            selectedAgent?.name || '新对话', 
            agentId
          );
          setMessages([]);
          return;
        }
        
        // 获取当前节点ID
        setCurrentNodeId(session.currentNodeId);
        
        // 获取对话历史
        const history = await chatService.getChatHistory(sessionId);
        
        // 转换为消息格式
        const chatMessages: Message[] = history.map(node => ({
          id: node.id,
          role: node.role,
          content: node.text,
          timestamp: node.timestamp
        }));
        
        setMessages(chatMessages);
        
        // 获取完整对话树
        const tree = await chatService.getChatTree(sessionId);
        setChatTree(tree);
      } catch (error) {
        console.error('Error fetching chat history:', error);
        toast({
          title: '获取对话历史失败',
          description: '无法加载对话历史，请稍后再试。',
          variant: 'destructive',
        });
      }
    };
    
    if (sessionId) {
      fetchChatHistory();
    }
  }, [sessionId, agentId, selectedAgent, toast]);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    try {
      // 添加用户消息到状态
      const userMessageContent = inputValue.trim();
      
      // 清空输入框
      setInputValue('');
      
      // 添加用户消息到聊天服务
      const userNode = await chatService.addUserMessage(sessionId, userMessageContent);
      
      // 更新当前节点
      setCurrentNodeId(userNode.id);
      
      // 更新消息列表
      setMessages(prev => [
        ...prev,
        {
          id: userNode.id,
          role: 'user',
          content: userMessageContent,
          timestamp: userNode.timestamp
        }
      ]);
      
      // 设置输入中状态
      setIsTyping(true);
      
      // 模拟API调用获取响应
      try {
        // 这里应该替换为实际的API调用，如Mastra generate API
        // const response = await MastraAPI.generate(agentId, userMessageContent);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 模拟响应
        const responseContent = `这是对"${userMessageContent}"的回复。作为${selectedAgent?.name || '智能助手'}，我很高兴能够帮助您。`;
        
        // 添加助手回复到聊天服务
        const assistantNode = await chatService.addAssistantResponse(sessionId, responseContent);
        
        // 更新当前节点
        setCurrentNodeId(assistantNode.id);
        
        // 更新消息列表
        setMessages(prev => [
          ...prev,
          {
            id: assistantNode.id,
            role: 'assistant',
            content: responseContent,
            timestamp: assistantNode.timestamp
          }
        ]);
        
        // 更新对话树
        const updatedTree = await chatService.getChatTree(sessionId);
        setChatTree(updatedTree);
      } catch (error) {
        console.error('Error generating response:', error);
        toast({
          title: '生成回复失败',
          description: '无法获取智能体响应，请稍后再试。',
          variant: 'destructive',
        });
      } finally {
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: '发送消息失败',
        description: '消息发送失败，请稍后再试。',
        variant: 'destructive',
      });
    }
  };
  
  // 清除对话
  const clearConversation = async () => {
    if (window.confirm('确定要清除当前对话吗？此操作不可撤销。')) {
      try {
        // 删除当前会话
        await chatService.deleteSession(sessionId);
        
        // 创建新会话
        const newSession = await chatService.createSession(
          selectedAgent?.name || '新对话', 
          agentId
        );
        
        // 更新状态
        setMessages([]);
        setCurrentNodeId(newSession.currentNodeId);
        
        // 获取对话树
        const tree = await chatService.getChatTree(newSession.id);
        setChatTree(tree);
        
        toast({
          title: '对话已清除',
          description: '已成功清除对话历史。',
        });
      } catch (error) {
        console.error('Error clearing conversation:', error);
        toast({
          title: '清除对话失败',
          description: '无法清除对话，请稍后再试。',
          variant: 'destructive',
        });
      }
    }
  };
  
  // 创建新分支
  const handleCreateBranch = async (parentNodeId: string) => {
    try {
      // 创建新分支
      const newBranchId = await chatService.createBranch(sessionId, parentNodeId);
      
      // 更新当前节点
      setCurrentNodeId(newBranchId);
      
      // 更新对话历史
      const history = await chatService.getChatHistory(sessionId);
      const chatMessages: Message[] = history.map(node => ({
        id: node.id,
        role: node.role,
        content: node.text,
        timestamp: node.timestamp
      }));
      setMessages(chatMessages);
      
      // 更新对话树
      const updatedTree = await chatService.getChatTree(sessionId);
      setChatTree(updatedTree);
      
      toast({
        title: '分支已创建',
        description: '新的对话分支已创建成功。',
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({
        title: '创建分支失败',
        description: '无法创建新分支，请稍后再试。',
        variant: 'destructive',
      });
    }
  };
  
  // 删除分支
  const handleDeleteBranch = async (nodeId: string) => {
    if (window.confirm('确定要删除这个分支吗？所有相关消息都将被删除。此操作不可撤销。')) {
      try {
        // 删除分支
        await chatService.deleteBranch(sessionId, nodeId);
        
        // 更新对话历史
        const history = await chatService.getChatHistory(sessionId);
        const chatMessages: Message[] = history.map(node => ({
          id: node.id,
          role: node.role,
          content: node.text,
          timestamp: node.timestamp
        }));
        setMessages(chatMessages);
        
        // 更新当前节点
        const session = await chatService.getSession(sessionId);
        if (session) {
          setCurrentNodeId(session.currentNodeId);
        }
        
        // 更新对话树
        const updatedTree = await chatService.getChatTree(sessionId);
        setChatTree(updatedTree);
        
        toast({
          title: '分支已删除',
          description: '对话分支已成功删除。',
        });
      } catch (error) {
        console.error('Error deleting branch:', error);
        toast({
          title: '删除分支失败',
          description: '无法删除分支，请稍后再试。',
          variant: 'destructive',
        });
      }
    }
  };
  
  // 选择对话节点
  const handleSelectNode = async (nodeId: string) => {
    try {
      // 切换到选定节点
      await chatService.switchToNode(sessionId, nodeId);
      
      // 更新当前节点
      setCurrentNodeId(nodeId);
      
      // 更新对话历史
      const history = await chatService.getChatHistory(sessionId);
      const chatMessages: Message[] = history.map(node => ({
        id: node.id,
        role: node.role,
        content: node.text,
        timestamp: node.timestamp
      }));
      setMessages(chatMessages);
      
      toast({
        title: '节点已切换',
        description: '已切换到选定的对话节点。',
      });
    } catch (error) {
      console.error('Error selecting node:', error);
      toast({
        title: '切换节点失败',
        description: '无法切换到选定节点，请稍后再试。',
        variant: 'destructive',
      });
    }
  };
  
  // 切换分支视图
  const toggleBranchView = () => {
    setShowBranchView(!showBranchView);
  };

  // 处理白板内容分享到对话
  const handleShareArtifact = (artifactData: any) => {
    if (artifactData.type === 'canvas') {
      // 分享画布图像
      const message: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: '[分享画布内容]',
        timestamp: new Date(),
        image: artifactData.dataUrl
      };
      
      // 添加消息到对话历史
      setMessages(prev => [...prev, message]);
      
      // 发送给智能体处理
      // 这里根据实际需求实现
      
    } else if (artifactData.type === 'code') {
      // 分享代码内容
      const message: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `\`\`\`html\n${artifactData.content}\n\`\`\``,
        timestamp: new Date()
      };
      
      // 添加消息到对话历史
      setMessages(prev => [...prev, message]);
      
      // 发送给智能体处理
      // 这里根据实际需求实现
    }
    
    // 关闭白板对话框
    setShowArtifacts(false);
  };

  return (
    <div className="h-full flex">
      {/* 对话树侧边栏 */}
      {showBranchView && (
        <div className="w-64 h-full">
          <ChatTree 
            sessionId={sessionId}
            onSelectNode={handleSelectNode}
            onCreateBranch={handleCreateBranch}
            onDeleteBranch={handleDeleteBranch}
            currentNodeId={currentNodeId}
          />
        </div>
      )}
      
      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 聊天头部 */}
        <div className="border-b border-border p-3 flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              {selectedAgent?.avatar ? (
                <AvatarImage src={selectedAgent.avatar} alt={selectedAgent.name} />
              ) : null}
              <AvatarFallback>
                {selectedAgent?.name?.substring(0, 2) || 'AI'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedAgent?.name || '智能助手'}</h3>
              <p className="text-xs text-muted-foreground">
                会话ID: {sessionId.substring(0, 8)}...
              </p>
            </div>
          </div>
          
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleBranchView}
              className={showBranchView ? 'bg-primary/10' : ''}
            >
              <GitBranch size={16} className="mr-1" />
              {showBranchView ? '隐藏分支树' : '显示分支树'}
            </Button>
          </div>
        </div>
        
        {/* 消息列表 */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                <Avatar className="h-16 w-16 mb-4">
                  {selectedAgent?.avatar ? (
                    <AvatarImage src={selectedAgent.avatar} alt={selectedAgent.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {selectedAgent?.name?.substring(0, 2) || 'AI'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-medium mb-2">{selectedAgent?.name || '智能助手'}</h3>
                <p className="max-w-sm">{selectedAgent?.description || '我是一个智能助手，可以回答您的问题和提供帮助。'}</p>
                <p className="mt-4 text-sm">发送消息开始对话</p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-3xl ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                    <div className="text-xs mt-1 opacity-70 text-right">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* 显示输入中状态 */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-muted max-w-3xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 用于自动滚动的引用 */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* 输入区域 */}
        <div className="p-3 border-t border-border">
          <div className="flex">
            <Textarea
              className="flex-1 min-h-10 resize-none"
              placeholder="输入消息..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
            />
            <Button 
              className="ml-2" 
              disabled={!inputValue.trim() || isTyping}
              onClick={sendMessage}
            >
              <SendHorizontal size={18} />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <FileUp size={16} className="mr-1" />
                上传文件
              </Button>
              
              <Dialog open={showArtifacts} onOpenChange={setShowArtifacts}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Paintbrush2 size={16} className="mr-1" />
                    白板(Artifacts)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh]">
                  <ArtifactsTab 
                    sessionId={sessionId} 
                    onShareArtifact={handleShareArtifact}
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            <Button variant="ghost" size="sm" onClick={clearConversation}>
              <RefreshCw size={16} className="mr-1" />
              清除对话
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MastraChat; 