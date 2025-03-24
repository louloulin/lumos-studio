import React, { useState, useCallback, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import { MastraAPI } from '../api/mastra';
import { MastraMessage } from '../api/types';
import { toast } from './ui/use-toast';

interface ChatProps {
  sessionId: string;
  agentId: string;
  initialMessage?: string;
  onMessageSent?: (text: string, response: string) => void;
}

const Chat: React.FC<ChatProps> = ({ sessionId, agentId, initialMessage, onMessageSent }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  // 处理初始消息
  useEffect(() => {
    if (initialMessage && !isLoading && messages.length === 0) {
      setInputValue(initialMessage);
    }
  }, [initialMessage, isLoading, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // 添加用户消息到聊天列表
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);
    try {
      // 准备发送给API的消息
      const mastraMessages: MastraMessage[] = [
        { role: 'user', content: userMessage }
      ];
      
      // 显示加载状态的消息
      setMessages(prev => [...prev, { role: 'assistant', content: '正在思考...' }]);
      
      // 记录完整的AI回复
      let fullResponse = '';
      
      // 使用流式API获取回复
      try {
        let responseStarted = false;
        
        for await (const chunk of MastraAPI.streamGenerate(agentId, {
          messages: mastraMessages,
          options: {
            temperature: 0.7,
            max_tokens: 2048
          }
        })) {
          // 更新响应内容
          fullResponse += chunk;
          
          if (!responseStarted) {
            // 替换"正在思考..."占位符
            setMessages(prev => [
              ...prev.slice(0, prev.length - 1),
              { role: 'assistant', content: chunk }
            ]);
            responseStarted = true;
          } else {
            // 更新现有回复
            setMessages(prev => [
              ...prev.slice(0, prev.length - 1),
              { role: 'assistant', content: fullResponse }
            ]);
          }
        }
        
        // 通知父组件
        if (onMessageSent) {
          onMessageSent(userMessage, fullResponse);
        }
      } catch (error) {
        console.error('Error in stream generation:', error);
        
        // 如果流式生成失败，尝试非流式API
        try {
          const response = await MastraAPI.generate(agentId, {
            messages: mastraMessages,
            options: {
              temperature: 0.7,
              max_tokens: 2048
            }
          });
          
          // 更新消息列表
          setMessages(prev => [
            ...prev.slice(0, prev.length - 1), // 移除"正在思考..."
            { role: 'assistant', content: response.text }
          ]);
          
          // 通知父组件
          if (onMessageSent) {
            onMessageSent(userMessage, response.text);
          }
        } catch (generateError) {
          console.error('Error in normal generation:', generateError);
          
          // 显示错误消息
          setMessages(prev => [
            ...prev.slice(0, prev.length - 1), // 移除"正在思考..."
            { role: 'assistant', content: '抱歉，我无法回应您的请求。请稍后再试。' }
          ]);
          
          toast({
            title: '生成回复失败',
            description: '无法获取智能体响应，请稍后再试。',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // 显示错误消息
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1), // 移除"正在思考..."
        { role: 'assistant', content: '抱歉，发生了错误。请稍后再试。' }
      ]);
      
      toast({
        title: '聊天错误',
        description: '处理消息时出错，请稍后再试。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            发送消息开始聊天
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-10'
                  : 'bg-muted mr-10'
              }`}
            >
              {message.content}
            </div>
          ))
        )}
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入消息..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default Chat; 