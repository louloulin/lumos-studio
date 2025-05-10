import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import { MastraAPI } from '../api/mastra';
import { MastraMessage } from '../api/types';
import { toast } from './ui/use-toast';
import { ScrollArea } from './ui/scroll-area';

interface ChatProps {
  sessionId: string;
  agentId: string;
  initialMessage?: string;
  onMessageSent?: (text: string, response: string) => void;
}

// 过滤掉AI响应中的调试信息
const filterDebugInfo = (text: string): string => {
  // 移除 Thought:, Action:, Response: 等调试信息
  const lines = text.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    // 过滤掉以Thought:, Action:, Response:开头的行
    return !(
      trimmedLine.startsWith('Thought:') || 
      trimmedLine.startsWith('Action:') || 
      trimmedLine.startsWith('Response:')
    );
  });
  
  // 如果消息中有分隔的调试段落，移除整个段落
  let result = filteredLines.join('\n');
  
  // 尝试移除一些常见调试模式的内容
  const debugPatterns = [
    /Thought: .*?(?=Action:|Response:|$)/gs,
    /Action: .*?(?=Response:|Thought:|$)/gs,
    /Response: (.*?)(?=Thought:|Action:|$)/s
  ];
  
  // 如果Response是最后一个，保留它的内容
  const responseMatch = result.match(/Response: (.*?)$/s);
  if (responseMatch && responseMatch[1]) {
    // 移除所有其他调试内容
    for (const pattern of debugPatterns) {
      result = result.replace(pattern, '');
    }
    // 保留Response的实际内容
    result = responseMatch[1].trim();
  }
  
  return result.trim();
};

const Chat: React.FC<ChatProps> = ({ sessionId, agentId, initialMessage, onMessageSent }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiErrorState, setApiErrorState] = useState<string | null>(null);

  // 处理初始消息
  useEffect(() => {
    if (initialMessage && !isLoading && messages.length === 0) {
      setInputValue(initialMessage);
    }
  }, [initialMessage, isLoading, messages.length]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 检查Mastra服务是否运行
  useEffect(() => {
    const checkMastraService = async () => {
      try {
        const isRunning = await MastraAPI.isRunning();
        if (!isRunning) {
          setApiErrorState('Mastra服务未运行，请确保服务已启动');
        } else {
          setApiErrorState(null);
          console.log('Mastra服务运行正常');
        }
      } catch (error) {
        console.error('Error checking Mastra service:', error);
        setApiErrorState('无法连接到Mastra服务，请检查网络或服务配置');
      }
    };
    
    checkMastraService();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果API错误状态存在，重新检查服务
    if (apiErrorState) {
      try {
        const isRunning = await MastraAPI.isRunning();
        if (!isRunning) {
          toast({
            title: 'Mastra服务未运行',
            description: '请先启动Mastra服务再尝试发送消息',
            variant: 'destructive',
          });
          return;
        } else {
          // 服务恢复正常
          setApiErrorState(null);
        }
      } catch (error) {
        toast({
          title: '连接服务失败',
          description: '无法连接到Mastra服务，请检查服务是否正常运行',
          variant: 'destructive',
        });
        return;
      }
    }

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
              { role: 'assistant', content: filterDebugInfo(chunk) }
            ]);
            responseStarted = true;
          } else {
            // 更新现有回复
            setMessages(prev => [
              ...prev.slice(0, prev.length - 1),
              { role: 'assistant', content: filterDebugInfo(fullResponse) }
            ]);
          }
        }
        
        // 通知父组件
        if (onMessageSent) {
          onMessageSent(userMessage, filterDebugInfo(fullResponse));
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
          
          // 更新消息列表，过滤调试信息
          setMessages(prev => [
            ...prev.slice(0, prev.length - 1), // 移除"正在思考..."
            { role: 'assistant', content: filterDebugInfo(response.text) }
          ]);
          
          // 通知父组件
          if (onMessageSent) {
            onMessageSent(userMessage, filterDebugInfo(response.text));
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
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      {/* API错误提示 - 固定在顶部，不参与滚动 */}
      {apiErrorState && (
        <div className="sticky top-0 z-10 bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-2 flex items-center justify-between">
          <div>
            <p className="font-medium">API错误</p>
            <p className="text-sm">{apiErrorState}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              try {
                const isRunning = await MastraAPI.isRunning();
                if (isRunning) {
                  setApiErrorState(null);
                  toast({
                    title: '连接恢复',
                    description: 'Mastra服务已恢复连接',
                  });
                }
              } catch (e) {
                toast({
                  title: '重试失败',
                  description: '连接仍然失败，请检查服务状态',
                  variant: 'destructive',
                });
              }
            }}
          >
            重试连接
          </Button>
        </div>
      )}
      
      {/* 聊天消息区域 - 设置精确的样式确保它能够正确滚动并留出底部空间 */}
      <div 
        className="overflow-y-auto w-full" 
        style={{ 
          height: 'calc(100% - 68px)',  // 减去输入框高度
          paddingBottom: '8px'
        }}
      >
        <div className="space-y-4 p-4">
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
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* 输入框 - 使用绝对定位固定在底部 */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background py-2 px-4" style={{ height: '68px' }}>
        <form onSubmit={handleSubmit} className="flex gap-2 h-full items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={apiErrorState ? "请先解决API连接问题..." : "输入消息..."}
            disabled={isLoading || !!apiErrorState}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim() || !!apiErrorState}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      {/* 加载指示器 */}
      {isLoading && (
        <div className="absolute bottom-[76px] left-4 bg-background/80 px-3 py-1 rounded-full shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat; 