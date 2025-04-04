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
import * as SessionService from '../services/session';
import { Session } from '../services/types';

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
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  
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
    if (!inputValue.trim() || isLoading || !session) return;
    
    try {
      // 清空输入框和设置加载状态
      const userMessage = inputValue.trim();
      setInputValue('');
      setIsLoading(true);
      
      // 防止用户快速多次点击发送按钮
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.setAttribute('disabled', 'true');
      }
      
      console.log(`[MastraChat] 发送消息: "${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}"`);
      
      // 确保会话存在
      if (!session) {
        console.error('[MastraChat] 会话不存在, sessionId:', sessionId);
        throw new Error('会话不存在');
      }
      
      // 添加用户消息到会话
      const updatedSession = SessionService.addUserMessage(sessionId, userMessage);
      
      if (!updatedSession) {
        console.error('[MastraChat] 添加用户消息失败');
        throw new Error('无法添加用户消息');
      }
      
      console.log(`[MastraChat] 用户消息已添加到会话, 会话现在有 ${updatedSession.messages.length} 条消息`);
      
      // 创建一个唯一的临时消息ID，确保不会重复
      const tempMessageId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      
      // 新增一个临时的加载消息
      const tempAssistantMessage: Message = {
        id: tempMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      
      console.log(`[MastraChat] 创建临时助手消息 ID: ${tempMessageId}`);
      
      // 更新本地消息列表，先移除任何现有的流式传输消息
      setMessages(prevMessages => {
        // 过滤掉所有标记为流式传输的消息
        const filteredMessages = prevMessages.filter(msg => !msg.isStreaming);
        
        // 防止添加重复的用户消息
        const hasUserMessage = filteredMessages.some(
          msg => msg.role === 'user' && msg.content === userMessage
        );
        
        // 用户消息对象
        const userMessageObj: Message = {
          id: 'user-' + Date.now(),
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        };
        
        return [
          ...filteredMessages,
          // 只在列表中没有相同内容的用户消息时才添加
          ...(hasUserMessage ? [] : [userMessageObj]),
          tempAssistantMessage
        ];
      });
      
      // 生成AI响应
      let responseContent = '';
      
      // 消息更新回调
      const onUpdate = (content: string) => {
        responseContent = content;
        
        console.log(`[MastraChat] 收到流式更新, 内容长度: ${content.length}`);
        
        // 更新消息列表中的临时消息
        setMessages(prevMessages => {
          // 查找临时消息
          const messageIndex = prevMessages.findIndex(msg => msg.id === tempMessageId);
          
          if (messageIndex >= 0) {
            // 创建新的消息数组
            const updatedMessages = [...prevMessages];
            // 更新临时消息
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              content,
              isStreaming: true
            };
            return updatedMessages;
          }
          
          // 如果找不到临时消息，可能已经被其他回调移除
          // 添加一个新的临时消息
          if (prevMessages.every(msg => msg.id !== tempMessageId)) {
            console.log(`[MastraChat] 临时消息未找到，添加新的临时消息`);
            return [
              ...prevMessages,
              {
                ...tempAssistantMessage,
                content,
                isStreaming: true
              }
            ];
          }
          
          return prevMessages;
        });
      };
      
      // 完成回调
      const onComplete = (updatedSession: Session) => {
        console.log(`[MastraChat] 生成完成, 新会话长度: ${updatedSession.messages.length}`);
        
        // 移除临时消息并添加完整的助手消息
        setMessages(prevMessages => {
          // 过滤掉所有临时消息
          const filteredMessages = prevMessages.filter(msg => !msg.isStreaming);
          
          // 获取助手最后一条消息
          const lastAssistantMessage = updatedSession.messages
            .filter(msg => msg.role === 'assistant')
            .pop();
          
          if (lastAssistantMessage) {
            console.log(`[MastraChat] 找到最后一条助手消息, ID: ${lastAssistantMessage.id}, 内容长度: ${lastAssistantMessage.content.length}`);
            
            // 检查是否已经有相同内容的消息
            const isDuplicate = filteredMessages.some(
              msg => msg.role === 'assistant' && msg.content === lastAssistantMessage.content
            );
            
            if (!isDuplicate) {
              return [
                ...filteredMessages,
                {
                  id: lastAssistantMessage.id || 'assistant-' + Date.now(),
                  role: 'assistant',
                  content: lastAssistantMessage.content,
                  timestamp: lastAssistantMessage.createdAt 
                    ? new Date(lastAssistantMessage.createdAt) 
                    : new Date(),
                  isStreaming: false
                }
              ];
            } else {
              console.log(`[MastraChat] 跳过添加重复消息`);
              return filteredMessages;
            }
          }
          
          return filteredMessages;
        });
        
        setIsLoading(false);
      };
      
      // 错误回调
      const onError = (error: Error) => {
        console.error(`[MastraChat] 生成响应出错: ${error.message}`);
        
        // 移除临时消息
        setMessages(prevMessages => 
          prevMessages.filter(msg => !msg.isStreaming)
        );
        
        // 添加错误消息
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: 'error-' + Date.now(),
            role: 'assistant',
            content: `抱歉，我无法生成响应: ${error.message}`,
            timestamp: new Date()
          }
        ]);
        
        setIsLoading(false);
        
        toast({
          title: '生成响应失败',
          description: error.message,
          variant: 'destructive',
        });
      };
      
      // 使用会话服务生成响应
      await SessionService.generateAssistantResponse(
        sessionId,
        undefined,
        onUpdate,
        onComplete,
        onError
      );
    } catch (error) {
      setIsLoading(false);
      console.error('[MastraChat] 发送消息失败:', error);
      
      toast({
        title: '发送消息失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      // 重新启用发送按钮
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.removeAttribute('disabled');
      }
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

  // 渲染消息
  const renderMessages = () => {
    // Filter out duplicate messages by grouping them first
    const uniqueMessages = messages.reduce((acc: Message[], current) => {
      // Check if we already have this message (by content) in our accumulator
      const duplicateIndex = acc.findIndex(
        msg => msg.role === current.role && msg.content === current.content && 
        // Allow temporary streaming messages to still appear
        (!current.isStreaming || msg.id === current.id)
      );
      
      // If it's a streaming message, always keep the most recent version
      if (current.isStreaming) {
        // Remove any previous streaming messages
        const filtered = acc.filter(msg => !msg.isStreaming);
        return [...filtered, current];
      }
      
      // Skip if it's a duplicate and not a streaming message
      if (duplicateIndex >= 0 && !current.isStreaming) {
        return acc;
      }
      
      // Otherwise, add the message to our accumulator
      return [...acc, current];
    }, []);
    
    return (
      <div
        className="flex-1 p-4 space-y-4 overflow-y-auto"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {uniqueMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-semibold mb-2">欢迎使用{selectedAgent?.name || '智能助手'}</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {selectedAgent?.description || '我是一个智能助手，可以回答您的问题和提供帮助。'}
            </p>
          </div>
        ) : (
          uniqueMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AI</AvatarFallback>
                  {selectedAgent?.avatar && (
                    <AvatarImage src={selectedAgent.avatar} alt={selectedAgent.name} />
                  )}
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.isStreaming ? (
                  <div>
                    {message.content}
                    <span className="animate-pulse inline-block ml-1">▋</span>
                  </div>
                ) : (
                  <Markdown>{message.content}</Markdown>
                )}
                {message.role === 'assistant' && !message.isStreaming && (
                  <div className="flex items-center justify-end mt-2">
                    <SpeechPlayer 
                      text={message.content} 
                      agentId={selectedAgent?.id || 'generalAssistant'}
                    />
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息区域 */}
      {renderMessages()}

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
            disabled={isTyping || !inputValue.trim() || isLoading}
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