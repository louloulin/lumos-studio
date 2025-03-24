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
import { MastraAPI } from '../api/mastra'; // 导入Mastra API
import { MastraMessage } from '../api/types'; // 导入类型定义

// 定义组件属性
interface MastraChatProps {
  sessionId: string;
  agentId: string;
}

// 定义消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
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
  
  // 检查Mastra服务是否运行
  useEffect(() => {
    const checkMastraService = async () => {
      try {
        const isRunning = await MastraAPI.isRunning();
        if (!isRunning) {
          toast({
            title: 'Mastra服务未运行',
            description: '无法连接到Mastra服务，请确保服务已启动。',
            variant: 'destructive',
          });
        } else {
          console.log('Mastra服务运行正常');
        }
      } catch (error) {
        console.error('Error checking Mastra service:', error);
        toast({
          title: 'Mastra服务检查失败',
          description: '检查Mastra服务时出错，请确保服务已正确配置。',
          variant: 'destructive',
        });
      }
    };
    
    checkMastraService();
  }, [toast]);
  
  // 从API获取智能体信息
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        // 从Mastra获取智能体列表
        const agentNames = await MastraAPI.getAgents();
        console.log('Available agents:', agentNames);
        
        // 如果找到匹配的智能体，使用它
        if (agentNames.includes(agentId)) {
          const agent: Agent = {
            id: agentId,
            name: agentId,
            description: `Mastra智能体: ${agentId}`,
            avatar: undefined
          };
    setSelectedAgent(agent);
          console.log(`使用Mastra智能体: ${agentId}`);
        } else if (agentNames.length > 0) {
          // 如果找不到指定的智能体但有其他智能体，使用第一个可用的智能体
          const firstAgent = agentNames[0];
          const agent: Agent = {
            id: firstAgent,
            name: firstAgent,
            description: `Mastra智能体: ${firstAgent}`,
            avatar: undefined
          };
          setSelectedAgent(agent);
          console.log(`找不到${agentId}，使用可用的Mastra智能体: ${firstAgent}`);
        } else {
          // 如果没有可用的智能体，使用通用助手
          toast({
            title: '未找到智能体',
            description: `找不到名为 "${agentId}" 的智能体，使用通用助手替代。`,
            variant: 'destructive',
          });
          
          const defaultAgent: Agent = {
            id: 'generalAssistant',
            name: '通用助手',
            description: '我是一个智能助手，可以回答您的问题和提供帮助。',
            avatar: undefined
          };
          setSelectedAgent(defaultAgent);
          console.log('未找到指定智能体，使用默认通用助手');
        }
      } catch (error) {
        console.error('Error fetching agent:', error);
        toast({
          title: '获取智能体信息失败',
          description: '无法加载智能体数据，请稍后再试。',
          variant: 'destructive',
        });
        
        // 使用通用助手作为备选
        const defaultAgent: Agent = {
          id: 'generalAssistant',
          name: '通用助手',
          description: '我是一个智能助手，可以回答您的问题和提供帮助。',
          avatar: undefined
        };
        setSelectedAgent(defaultAgent);
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
    
    if (sessionId && selectedAgent) {
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
    const userMessage: Message = {
        id: userNode.id,
      role: 'user',
        content: userMessageContent,
        timestamp: userNode.timestamp
    };
    
    setMessages(prev => [...prev, userMessage]);
      
      // 设置输入中状态
      setIsTyping(true);
      
      // 创建一个临时消息表示正在加载
      const tempId = Date.now().toString();
      const tempMessage: Message = {
        id: tempId,
          role: 'assistant',
          content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // 准备消息历史
      const mastraMessages: MastraMessage[] = [
        ...messages
          .filter(msg => !msg.isStreaming)
          .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
        { role: 'user', content: userMessageContent }
      ];
      
      // 获取要使用的智能体ID
      const activeAgentId = selectedAgent?.id || 'generalAssistant';
      console.log(`使用智能体 ${activeAgentId} 生成回复`);
      
      // 使用流式API获取回复
      try {
        let fullResponse = '';
        
        for await (const chunk of MastraAPI.streamGenerate(activeAgentId, {
          messages: mastraMessages,
          options: {
            temperature: 0.7,
            max_tokens: 2048
          }
        })) {
          // 更新消息内容
          fullResponse += chunk;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, content: fullResponse } 
                : msg
            )
          );
          
          // 滚动到最新消息
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        
        // 生成完成后，添加最终消息到聊天服务
        const assistantNode = await chatService.addAssistantResponse(sessionId, fullResponse);
        
        // 更新消息，移除流式标记
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { 
                  id: assistantNode.id,
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: assistantNode.timestamp,
                  isStreaming: false
                } 
              : msg
          )
        );
        
        // 更新当前节点
        setCurrentNodeId(assistantNode.id);
        
        // 更新对话树
        const updatedTree = await chatService.getChatTree(sessionId);
        setChatTree(updatedTree);
      } catch (error) {
        console.error('Error in stream generation:', error);
        
        // 如果流式生成失败，尝试非流式API
        try {
          console.log('Falling back to non-streaming API');
          const response = await MastraAPI.generate(activeAgentId, {
            messages: mastraMessages,
            options: {
              temperature: 0.7,
              max_tokens: 2048
            }
          });
          
          // 添加助手回复到聊天服务
          const assistantNode = await chatService.addAssistantResponse(sessionId, response.text);
          
          // 更新消息列表
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? {
                    id: assistantNode.id,
                    role: 'assistant',
                    content: response.text,
                    timestamp: assistantNode.timestamp,
                    isStreaming: false
                  } 
                : msg
            )
          );
          
          // 更新当前节点
          setCurrentNodeId(assistantNode.id);
          
          // 更新对话树
          const updatedTree = await chatService.getChatTree(sessionId);
          setChatTree(updatedTree);
        } catch (generateError) {
          console.error('Error in normal generation:', generateError);
          // 更新错误消息
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? {
                    ...msg,
                    content: '抱歉，生成回复时出错了。请稍后再试。',
                    isStreaming: false
                  } 
                : msg
            )
          );
          
          toast({
            title: '生成回复失败',
            description: '无法获取智能体响应，请稍后再试。',
            variant: 'destructive',
          });
        }
      } finally {
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
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
      const userMessageContent = '[分享画布内容]';
      const userMessageId = Date.now().toString();
      
      // 添加用户消息到状态
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: userMessageContent,
        timestamp: new Date(),
        image: artifactData.dataUrl
      };
      
      // 添加消息到聊天历史
      setMessages(prev => [...prev, userMessage]);
      
      // 添加用户消息到聊天服务
      (async () => {
        try {
          // 保存文本消息到聊天服务
          const userNode = await chatService.addUserMessage(sessionId, userMessageContent);
          
          // 更新当前节点
          setCurrentNodeId(userNode.id);
          
          // 设置输入中状态
          setIsTyping(true);
          
          // 创建一个临时消息表示正在加载
          const tempId = Date.now().toString();
          const tempMessage: Message = {
            id: tempId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true
          };
          
          setMessages(prev => [...prev, tempMessage]);
          
          // 准备消息历史（包含图片信息）
          const mastraMessages: MastraMessage[] = [
            ...messages
              .filter(msg => !msg.isStreaming)
              .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.image 
                  ? [
                      { type: 'text' as const, text: msg.content },
                      { type: 'image' as const, image: msg.image }
                    ] 
                  : msg.content
              })),
            {
              role: 'user', 
              content: [
                { type: 'text' as const, text: userMessageContent },
                { type: 'image' as const, image: artifactData.dataUrl }
              ]
            }
          ];
          
          // 获取要使用的智能体ID
          const activeAgentId = selectedAgent?.id || 'generalAssistant';
          console.log(`使用智能体 ${activeAgentId} 处理画布图像`);
          
          // 使用流式API获取回复
          try {
            let fullResponse = '';
            
            for await (const chunk of MastraAPI.streamGenerate(activeAgentId, {
              messages: mastraMessages,
              options: {
                temperature: 0.7,
                max_tokens: 2048
              }
            })) {
              // 更新消息内容
              fullResponse += chunk;
              
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === tempId 
                    ? { ...msg, content: fullResponse } 
                    : msg
                )
              );
              
              // 滚动到最新消息
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
            
            // 生成完成后，添加最终消息到聊天服务
            const assistantNode = await chatService.addAssistantResponse(sessionId, fullResponse);
            
            // 更新消息，移除流式标记
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempId 
                  ? { 
                      id: assistantNode.id,
                      role: 'assistant',
                      content: fullResponse,
                      timestamp: assistantNode.timestamp,
                      isStreaming: false
                    } 
                  : msg
              )
            );
            
            // 更新当前节点
            setCurrentNodeId(assistantNode.id);
            
            // 更新对话树
            const updatedTree = await chatService.getChatTree(sessionId);
            setChatTree(updatedTree);
          } catch (error) {
            console.error('Error in stream generation for image:', error);
            
            // 如果流式生成失败，尝试非流式API
            try {
              console.log('Falling back to non-streaming API for image');
              const response = await MastraAPI.generate(activeAgentId, {
                messages: mastraMessages,
                options: {
                  temperature: 0.7,
                  max_tokens: 2048
                }
              });
              
              // 添加助手回复到聊天服务
              const assistantNode = await chatService.addAssistantResponse(sessionId, response.text);
              
              // 更新消息列表
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === tempId 
                    ? {
                        id: assistantNode.id,
                        role: 'assistant',
                        content: response.text,
                        timestamp: assistantNode.timestamp,
                        isStreaming: false
                      } 
                    : msg
                )
              );
              
              // 更新当前节点
              setCurrentNodeId(assistantNode.id);
              
              // 更新对话树
              const updatedTree = await chatService.getChatTree(sessionId);
              setChatTree(updatedTree);
            } catch (generateError) {
              console.error('Error in normal generation for image:', generateError);
              // 更新错误消息
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === tempId 
                    ? {
                        ...msg,
                        content: '抱歉，处理图像时出错了。请稍后再试。',
                        isStreaming: false
                      } 
                    : msg
                )
              );
              
              toast({
                title: '处理图像失败',
                description: '无法获取智能体对图像的响应，请稍后再试。',
                variant: 'destructive',
              });
            }
          } finally {
            setIsTyping(false);
          }
        } catch (error) {
          console.error('Error processing shared canvas:', error);
          setIsTyping(false);
          toast({
            title: '处理画布内容失败',
            description: '无法处理分享的画布内容，请稍后再试。',
            variant: 'destructive',
          });
        }
      })();
    } else if (artifactData.type === 'code') {
      // 分享代码内容
      const userMessageContent = `\`\`\`html\n${artifactData.content}\n\`\`\``;
      
      // 添加到输入框，让用户可以编辑后发送
      setInputValue(userMessageContent);
      
      // 关闭白板对话框
      setShowArtifacts(false);
      
      // 聚焦输入框
      document.querySelector('textarea')?.focus();
      return;
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
                    {/* 如果有图片，显示图片 */}
                    {message.image && (
                      <div className="mt-2">
                        <img 
                          src={message.image} 
                          alt="Shared canvas" 
                          className="max-w-full rounded-md" 
                          style={{ maxHeight: '300px' }}
                        />
                        </div>
                      )}
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