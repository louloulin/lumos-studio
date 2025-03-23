import React, { useState, useEffect, useRef } from 'react';
import { MastraAPI } from '../api/mastra';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, User, Bot, Plus, RefreshCw, Settings, Image as ImageIcon, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Markdown from './Markdown';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import { toast } from '@/hooks/use-toast';
import ImageUploadInput from './ImageUploadInput';
import { MessageContent, MastraMessage } from '../api/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: string[]; // Base64 encoded images
}

interface AgentProfile {
  id: string;
  name: string;
  avatar?: string;
  description: string;
}

interface MastraChatProps {
  sessionId?: string;
  agentId?: string;
}

const MastraChat: React.FC<MastraChatProps> = ({ sessionId, agentId }) => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 映射智能体名称到配置文件
  const agentProfiles: Record<string, Omit<AgentProfile, 'id'>> = {
    'WeatherAssistant': {
      name: '天气助手',
      avatar: '/agents/weather-assistant.png',
      description: '提供天气信息和预报的专业助手'
    },
    'GeneralAssistant': {
      name: '通用助手',
      avatar: '/agents/general-assistant.png',
      description: '能够回答各种问题的多功能助手'
    },
    'CustomerSupport': {
      name: '客户服务',
      avatar: '/agents/customer-support.png',
      description: '专业的客户支持代表，解决技术问题'
    },
    'CreativeWriter': {
      name: '创意写作',
      avatar: '/agents/creative-writer.png',
      description: '帮助进行创意写作和内容创作的助手'
    }
  };

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 检查Mastra服务状态并加载智能体
  useEffect(() => {
    const checkService = async () => {
      try {
        const running = await MastraAPI.isRunning();
        setIsServiceRunning(running);
        
        if (running) {
          const availableAgents = await MastraAPI.getAgents();
          const profiledAgents = availableAgents.map(name => ({
            id: name,
            ...(agentProfiles[name] || {
              name,
              avatar: undefined,
              description: `${name} 智能体`
            })
          }));
          
          setAgents(profiledAgents);
          
          if (profiledAgents.length > 0 && !selectedAgent) {
            setSelectedAgent(profiledAgents[0]);
          }
        }
      } catch (error) {
        console.error('Error checking Mastra service:', error);
        setIsServiceRunning(false);
      }
    };
    
    checkService();
    
    // 设置定期检查服务状态
    const interval = setInterval(checkService, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sessionId && agentId) {
      console.log(`Initializing chat for session ${sessionId} with agent ${agentId}`);
      // Implement session-specific logic here
    }
  }, [sessionId, agentId]);

  const handleAgentSelect = (agent: AgentProfile) => {
    setSelectedAgent(agent);
    // 可以选择是否清除消息历史
    // setMessages([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: string[] = [];
    
    Array.from(files).forEach(file => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: '不支持的文件类型',
          description: '请上传图片文件 (JPG, PNG, GIF等)',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '文件过大',
          description: '图片大小不能超过5MB',
          variant: 'destructive'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64String = e.target.result.toString();
          setUploadedImages(prev => [...prev, base64String]);
          newImages.push(base64String);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!input.trim() && uploadedImages.length === 0) return;
    if (!selectedAgent) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedImages([]);
    setLoading(true);
    
    try {
      // For streaming responses
      if (selectedAgent.id === 'GeneralAssistant') {
        setIsStreaming(true);
        
        // Create a placeholder for the assistant's message
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now() + 1
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // 转换消息格式为Mastra API需要的格式
        const formattedMessages = getMessageHistoryForAPI();
        
        // 添加用户最新消息
        const userContent: MessageContent[] = [];
        if (userMessage.content) {
          userContent.push({
            type: 'text',
            text: userMessage.content
          });
        }
        
        if (userMessage.images && userMessage.images.length > 0) {
          userMessage.images.forEach(imageData => {
            userContent.push({
              type: 'image',
              image: imageData
            });
          });
        }
        
        formattedMessages.push({
          role: 'user',
          content: userContent
        });
        
        // Stream the response
        const streamGenerator = MastraAPI.streamGenerate(selectedAgent.id, {
          messages: formattedMessages,
          stream: true
        });
        
        let fullResponse = '';
        
        for await (const chunk of streamGenerator) {
          fullResponse += chunk;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: fullResponse } 
                : msg
            )
          );
        }
        
        setIsStreaming(false);
      } else {
        // For non-streaming responses
        // 转换消息格式为Mastra API需要的格式
        const formattedMessages = getMessageHistoryForAPI();
        
        // 添加用户最新消息
        const userContent: MessageContent[] = [];
        if (userMessage.content) {
          userContent.push({
            type: 'text',
            text: userMessage.content
          });
        }
        
        if (userMessage.images && userMessage.images.length > 0) {
          userMessage.images.forEach(imageData => {
            userContent.push({
              type: 'image',
              image: imageData
            });
          });
        }
        
        formattedMessages.push({
          role: 'user',
          content: userContent
        });
        
        const response = await MastraAPI.generate(selectedAgent.id, {
          messages: formattedMessages,
          stream: false
        });
        
        // Add assistant's response to the chat
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text,
          timestamp: Date.now() + 1
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: '生成回复时出错',
        description: '请稍后再试或联系管理员',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format messages for the API
  const getMessageHistoryForAPI = (): MastraMessage[] => {
    return messages.map(msg => {
      if (msg.images && msg.images.length > 0) {
        const content: MessageContent[] = [];
        if (msg.content) {
          content.push({
            type: 'text',
            text: msg.content
          });
        }
        
        msg.images.forEach(imageData => {
          content.push({
            type: 'image',
            image: imageData
          });
        });
        
        return { role: msg.role, content };
      } else {
        return { 
          role: msg.role, 
          content: [{
            type: 'text',
            text: msg.content
          }]
        };
      }
    });
  };

  const clearConversation = () => {
    setMessages([]);
  };

  if (!isServiceRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Mastra 服务未运行</h2>
        <p className="text-gray-600 mb-4 max-w-md">
          无法连接到 Mastra 服务。请检查您的配置并重新启动应用程序。
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* 侧边栏: 智能体列表 */}
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">智能体列表</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>加载智能体中...</p>
              <div className="mt-2 space-y-2">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
          ) : (
            agents.map(agent => (
              <div
                key={agent.id}
                className={cn(
                  "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                  selectedAgent?.id === agent.id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-primary/5"
                )}
                onClick={() => handleAgentSelect(agent)}
              >
                <Avatar className="h-8 w-8 mr-3">
                  {agent.avatar ? (
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {agent.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-gray-500 truncate">{agent.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-3 border-t border-border mt-auto">
          <Button variant="outline" className="w-full" onClick={clearConversation}>
            <RefreshCw className="h-4 w-4 mr-2" />
            清除对话
          </Button>
        </div>
      </div>
      
      {/* 主内容区: 聊天界面 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedAgent ? (
          <>
            {/* 对话历史 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <Avatar className="h-16 w-16 mb-4">
                    {selectedAgent.avatar ? (
                      <AvatarImage src={selectedAgent.avatar} alt={selectedAgent.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedAgent.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-medium mb-2">{selectedAgent.name}</h3>
                  <p className="max-w-sm">{selectedAgent.description}</p>
                  <p className="mt-4 text-sm">发送消息开始对话</p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-3xl rounded-lg p-4",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground ml-12"
                          : "bg-muted mr-12"
                      )}
                    >
                      <div className="flex items-center mb-2">
                        <Avatar className="h-6 w-6 mr-2">
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : selectedAgent.avatar ? (
                            <AvatarImage src={selectedAgent.avatar} alt={selectedAgent.name} />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </Avatar>
                        <span className="font-medium text-sm">
                          {message.role === 'user' ? '你' : selectedAgent.name}
                        </span>
                        <span className="ml-2 text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {/* Display any uploaded images */}
                      {message.images && message.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.images.map((img, index) => (
                            <div key={`${message.id}-img-${index}`} className="relative">
                              <img 
                                src={img} 
                                alt={`Uploaded ${index + 1}`} 
                                className="max-w-xs rounded-md object-contain max-h-64" 
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Display text content */}
                      {message.content && (
                        <div className={message.role === 'assistant' ? "prose dark:prose-invert max-w-none" : ""}>
                          {message.role === 'assistant' ? (
                            <Markdown>{message.content}</Markdown>
                          ) : (
                            <p>{message.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* 输入区域 */}
            <div className="p-4 border-t border-border">
              <ImageUploadInput
                onSend={(text, images) => {
                  setInput(text);
                  setUploadedImages(images);
                  handleSubmit();
                }}
                disabled={loading}
                placeholder={`向 ${selectedAgent.name} 发送消息...`}
              />
              {isStreaming && (
                <p className="text-xs text-gray-500 mt-1 animate-pulse">
                  正在生成回复...
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500">请从左侧选择一个智能体开始对话</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MastraChat; 