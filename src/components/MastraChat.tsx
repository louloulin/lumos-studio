import React, { useState, useEffect, useRef } from 'react';
import { MastraAPI } from '../api/mastra';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, User, Bot, Plus, RefreshCw, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Markdown from './Markdown';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async () => {
    if (!selectedAgent || !input.trim() || loading) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // 创建一个占位的助手消息
    const assistantMessageId = `msg-${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    try {
      // 使用流式响应
      setIsStreaming(true);
      let fullResponse = '';
      
      const generator = MastraAPI.streamGenerate(selectedAgent.id, {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true
      });
      
      for await (const chunk of generator) {
        fullResponse += chunk;
        
        // 更新消息内容
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullResponse } 
            : msg
        ));
      }
      
      setIsStreaming(false);
    } catch (error) {
      console.error('Error generating response:', error);
      
      // 更新错误消息
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: '抱歉，生成回复时出现错误。请稍后再试。' } 
          : msg
      ));
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
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
                      
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <Markdown>{message.content}</Markdown>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* 输入区域 */}
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={`向 ${selectedAgent.name} 发送消息...`}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
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