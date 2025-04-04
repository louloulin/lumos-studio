import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send } from 'lucide-react';
import { chatService } from './ChatService';

// 定义消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  
  // 获取会话信息
  useEffect(() => {
    const session = chatService.getSession(sessionId);
    if (session) {
      // 如果会话存在但没有初始消息，添加一条欢迎消息
      if (messages.length === 0) {
        setMessages([
          {
            id: '1',
            content: `你好！我是${session.name}，有什么我可以帮助你的吗？`,
            role: 'assistant',
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [sessionId, messages.length]);

  // 处理发送消息
  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 模拟AI响应延迟
      setTimeout(() => {
        // 添加AI响应
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `这是对"${inputValue}"的回复。在实际应用中，这里会调用AI服务获取真实回复。`,
          role: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);

        // 更新会话最后一条消息
        chatService.updateSession(sessionId, {
          lastMessage: aiMessage.content,
          lastUpdated: new Date()
        });
      }, 1000);
    } catch (error) {
      console.error('获取AI回复失败', error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息区域 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex items-start max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className={message.role === 'user' ? 'ml-2' : 'mr-2'}>
                <AvatarFallback>
                  {message.role === 'user' ? '👤' : '🤖'}
                </AvatarFallback>
              </Avatar>
              <div
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start">
              <Avatar className="mr-2">
                <AvatarFallback>🤖</AvatarFallback>
              </Avatar>
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          </div>
        )}
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
      </div>
    </div>
  );
};

export default MastraChat; 