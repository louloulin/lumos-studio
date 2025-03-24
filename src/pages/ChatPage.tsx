import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { ArrowLeft, Menu, Settings } from 'lucide-react';
import { useAtom } from 'jotai';
import { openSettingDialogAtom } from '../stores/atoms';
import { SettingWindowTab } from '../shared/types';
import MastraChat from '../components/MastraChat';
import { v4 as uuidv4 } from 'uuid';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [, setOpenSettingDialog] = useAtom(openSettingDialogAtom);
  const [sessionId] = useState(() => {
    // 检查URL参数中是否有sessionId
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sessionId');
    // 如果有则使用，没有则生成新的
    return id || uuidv4();
  });
  
  const [agentId] = useState(() => {
    // 检查URL参数中是否有agentId
    const params = new URLSearchParams(window.location.search);
    const id = params.get('agentId');
    // 如果有则使用，没有则使用默认的
    return id || 'generalAssistant';
  });

  // 打开设置对话框
  const openSettings = (tab: SettingWindowTab) => {
    setOpenSettingDialog(tab);
  };

  return (
    <div className="flex flex-col w-full h-full tauri-window-container bg-background">
      {/* 页面头部 */}
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-4">AI 聊天助手</h1>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => openSettings('general' as SettingWindowTab)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MastraChat sessionId={sessionId} agentId={agentId} />
        </div>
      </main>
    </div>
  );
};

export default ChatPage; 