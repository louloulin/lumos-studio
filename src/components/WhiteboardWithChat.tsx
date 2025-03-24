import { useCallback, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import Chat from './Chat';
import VoiceChat from './VoiceChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Mic, MessageSquare } from 'lucide-react';
import { useWhiteboardStore } from '../stores/whiteboardStore';

const WhiteboardWithChat = () => {
  const excalidrawRef = useRef<any>(null);
  const { agentId, sessionId } = useWhiteboardStore();
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);

  // 当聊天或语音发送消息时添加到消息列表
  const handleMessageSent = useCallback((userMessage: string, aiResponse: string) => {
    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    ]);
  }, []);

  return (
    <div className="flex h-full">
      <div className="flex-1 h-full">
        <Excalidraw
          ref={excalidrawRef}
          initialData={{
            appState: { theme: 'light' },
          }}
        />
      </div>
      <div className="w-96 p-4 border-l overflow-auto h-full">
        <Tabs defaultValue="chat">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              文字聊天
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-1">
              <Mic className="h-4 w-4" />
              语音对话
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-0">
            <Chat 
              agentId={agentId}
              sessionId={sessionId}
              onMessageSent={handleMessageSent}
            />
          </TabsContent>
          
          <TabsContent value="voice" className="mt-0">
            <VoiceChat 
              agentId={agentId}
              sessionId={sessionId}
              onMessageSent={handleMessageSent}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WhiteboardWithChat; 