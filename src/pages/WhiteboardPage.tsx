import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
  };

  const handleMessageSent = (userMessage: string, response: string) => {
    // 消息发送后清除SVG内容
    setSvgForChat(null);
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      {/* 白板区域 */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">智能白板</h2>
        <WhiteboardWithExcalidraw onSendToChat={handleSendToChat} />
      </div>
      
      {/* 聊天区域 */}
      <div className="w-1/3 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">AI 助手</h2>
        
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="mb-2">
            <TabsTrigger value="chat">文字聊天</TabsTrigger>
            <TabsTrigger value="voice">语音聊天</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col">
            <div className="flex-1 border rounded-md p-4 overflow-hidden">
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
  );
};

export default WhiteboardPage; 