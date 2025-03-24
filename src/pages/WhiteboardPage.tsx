import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { ChevronLeft, Maximize, Minimize, MessageSquare, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chat from '../components/Chat';
import VoiceChat from '../components/VoiceChat';
import WhiteboardWithExcalidraw from '../components/WhiteboardWithExcalidraw';
import { useAtom } from 'jotai';
import { whiteboardAtom, ensureWhiteboardState, updateWhiteboardState } from '../stores/whiteboardStore';
import { v4 as uuidv4 } from 'uuid';

const WhiteboardPage: React.FC = () => {
  const [whiteboardState, setWhiteboardState] = useAtom(whiteboardAtom);
  const [svgForChat, setSvgForChat] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // 检测屏幕大小
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // 在移动设备上默认折叠侧边栏
      if (isMobileView && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isSidebarCollapsed]);

  // 确保白板状态正确初始化
  useEffect(() => {
    // 检查白板状态是否有效
    const validState = ensureWhiteboardState(whiteboardState);
    
    // 如果sessionId不存在，初始化状态
    if (!whiteboardState?.sessionId) {
      const newState = {
        ...validState,
        sessionId: uuidv4(),
        agentId: 'agent'
      };
      
      // 更新状态
      setWhiteboardState(newState);
      
      // 备份到localStorage
      updateWhiteboardState(newState);
    }
    
    setIsLoaded(true);
  }, [whiteboardState, setWhiteboardState]);

  // 如果状态未加载完成，显示加载指示器
  if (!isLoaded || !whiteboardState?.sessionId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">正在加载白板...</p>
        </div>
      </div>
    );
  }

  const handleSendToChat = (svgString: string) => {
    setSvgForChat(svgString);
    // 在移动设备上，当发送到聊天时自动展开侧边栏
    if (isMobile && isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  };

  const handleMessageSent = (userMessage: string, response: string) => {
    // 消息发送后清除SVG内容
    setSvgForChat(null);
  };

  // 切换侧边栏显示状态
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="flex justify-between items-center px-4 py-2 border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回主页
          </Button>
          <h1 className="text-xl font-bold">智能白板</h1>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSidebar}
          className="ml-2"
        >
          {isSidebarCollapsed ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          <span className="ml-1 hidden md:inline">
            {isSidebarCollapsed ? '展开聊天' : '收起聊天'}
          </span>
        </Button>
      </header>
      
      {/* 主体内容 - 自适应布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 白板区域 */}
        <div className={`flex-1 ${!isSidebarCollapsed && isMobile ? 'hidden' : ''} p-2`}>
          <WhiteboardWithExcalidraw onSendToChat={handleSendToChat} />
        </div>
        
        {/* 聊天区域 - 响应式宽度 */}
        <div 
          className={`
            ${isSidebarCollapsed ? 'hidden' : isMobile ? 'w-full' : 'w-1/3'} 
            flex flex-col border-l p-2
          `}
        >
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mb-2">
              <TabsTrigger value="chat">文字聊天</TabsTrigger>
              <TabsTrigger value="voice">语音聊天</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col">
              <div className="flex-1 border rounded-md p-2 overflow-hidden">
                <Chat 
                  sessionId={whiteboardState.sessionId}
                  agentId={whiteboardState.agentId}
                  initialMessage={svgForChat ? `我分享了一个白板内容，请帮我分析一下：\n${svgForChat}` : undefined}
                  onMessageSent={handleMessageSent}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="voice" className="flex-1">
              <div className="border rounded-md h-full">
                <VoiceChat 
                  sessionId={whiteboardState.sessionId}
                  agentId={whiteboardState.agentId}
                  onMessageSent={handleMessageSent}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* 移动设备上的浮动切换按钮 */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-10">
          <Button 
            size="sm" 
            onClick={toggleSidebar}
            className="rounded-full w-14 h-14 shadow-lg"
          >
            {isSidebarCollapsed ? <MessageSquare className="h-6 w-6" /> : <PenTool className="h-6 w-6" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WhiteboardPage; 