import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, RefreshCw, FileUp, Paintbrush2 } from 'lucide-react';
import { chatService, ChatNode } from './ChatService';
import { useToast } from './ui/use-toast';
import { MastraAPI } from '../api/mastra'; // 导入Mastra API
import Markdown from './Markdown';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import ArtifactsTab from './ArtifactsTab';
import { VoiceRecorder } from './VoiceRecorder';
import { SpeechPlayer } from './SpeechPlayer';

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

// 定义组件属性
interface MastraChatProps {
  sessionId: string;
  agentId: string;
}

const MastraChat: React.FC<MastraChatProps> = ({ sessionId, agentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [chatTree, setChatTree] = useState<ChatNode | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showArtifacts, setShowArtifacts] = useState(false);
  
  // 处理滚动事件，决定是否应该自动滚动
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // 如果用户滚动到距离底部50px以内，则自动滚动到底部
    // 如果用户向上滚动，则停止自动滚动
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldScrollToBottom(isNearBottom);
  };
  
  // 滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: isTyping ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  }, [shouldScrollToBottom, isTyping]);
  
  // 当消息更新或有新消息时，决定是否滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
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

  // 发送消息
  const handleSubmit = async () => {
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
      const mastraMessages = messages
        .filter(msg => !msg.isStreaming)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      
      // 添加当前用户消息
      mastraMessages.push({ role: 'user', content: userMessageContent });
      
      // 获取要使用的智能体ID
      const activeAgentId = selectedAgent?.id || 'generalAssistant';
      console.log(`使用智能体 ${activeAgentId} 生成回复`);
      
      // 使用流式API获取回复
      try {
        let fullResponse = '';
        let streamChunks = [];
        
        for await (const chunk of MastraAPI.streamGenerate(activeAgentId, {
          messages: mastraMessages,
          options: {
            temperature: 0.7,
            max_tokens: 2048
          }
        })) {
          // 收集流式块
          streamChunks.push(chunk);
          fullResponse += chunk;
          
          // 批量更新以获得更流畅的体验，每3个块或50ms更新一次
          if (streamChunks.length >= 3) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempId 
                  ? { ...msg, content: fullResponse } 
                  : msg
              )
            );
            streamChunks = [];
            
            // 给UI时间渲染
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        // 确保显示完整的响应
        if (streamChunks.length > 0) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, content: fullResponse } 
                : msg
            )
          );
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

  // 处理白板内容分享到对话
  const handleShareArtifact = (artifactData: any) => {
    if (artifactData.type === 'canvas') {
      // 分享画布图像
      const userMessageContent = '[分享画布内容]';
      
      // 添加用户消息到聊天服务
      (async () => {
        try {
          // 保存文本消息到聊天服务
          const userNode = await chatService.addUserMessage(sessionId, userMessageContent);
          
          // 更新当前节点
          setCurrentNodeId(userNode.id);
          
          // 更新消息列表
          const userMessage: Message = {
            id: userNode.id,
            role: 'user',
            content: userMessageContent,
            timestamp: userNode.timestamp,
            image: artifactData.dataUrl
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
          const mastraMessages = [
            ...messages
              .filter(msg => !msg.isStreaming)
              .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
              })),
            { role: 'user', content: userMessageContent + "\n[图片内容]" }
          ];
          
          // 获取要使用的智能体ID
          const activeAgentId = selectedAgent?.id || 'generalAssistant';
          
          // 使用API获取回复
          try {
            // 使用普通API，因为图片处理复杂
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
            
          } catch (error) {
            console.error('Error handling canvas image:', error);
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
    } else if (artifactData.type === 'text') {
      // 分享文本内容
      setInputValue(artifactData.content);
    }
    
    // 关闭白板对话框
    setShowArtifacts(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息区域 */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
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
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                } max-w-[85%]`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 w-full">
                    <Markdown>
                      {message.content}
                    </Markdown>
                  </div>
                  {message.role === 'assistant' && !message.isStreaming && (
                    <SpeechPlayer
                      text={message.content}
                      agentId={selectedAgent?.id || 'generalAssistant'}
                      className="opacity-70 hover:opacity-100 flex-shrink-0 ml-2"
                    />
                  )}
                </div>

                {/* 如果有图片，显示图片 */}
                {message.image && (
                  <div className="mt-2">
                    <img 
                      src={message.image} 
                      alt="Shared content" 
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
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* 用于自动滚动的引用 */}
        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <div className="flex space-x-2 items-end">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="输入消息..."
            className="min-h-10 resize-none flex-1"
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={isTyping || !inputValue.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-between mt-2">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <FileUp size={16} className="mr-1" />
              上传文件
            </Button>
            
            <Dialog open={showArtifacts} onOpenChange={setShowArtifacts}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Paintbrush2 size={16} className="mr-1" />
                  白板
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[80vh]">
                <ArtifactsTab 
                  onShareArtifact={handleShareArtifact}
                />
              </DialogContent>
            </Dialog>
            
            {/* 添加语音输入按钮 */}
            <VoiceRecorder 
              onTranscription={(text) => setInputValue(prev => prev + text)}
              agentId={selectedAgent?.id || 'generalAssistant'}
            />
          </div>
          
          <Button variant="ghost" size="sm" onClick={clearConversation}>
            <RefreshCw size={16} className="mr-1" />
            清除对话
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MastraChat; 