import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { PenTool, ArrowRight, Settings, MessageSquare } from 'lucide-react';
import { useAtom } from 'jotai';
import { openSettingDialogAtom } from '../stores/atoms';
import { SettingWindowTab } from '../shared/types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [, setOpenSettingDialog] = useAtom(openSettingDialogAtom);

  // 打开设置对话框
  const openSettings = (tab: SettingWindowTab) => {
    setOpenSettingDialog(tab);
  };

  return (
    <div className="flex flex-col w-full h-full tauri-window-container p-4 overflow-auto bg-background">
      {/* 页面头部 */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lumos Studio</h1>
        <Button variant="ghost" size="icon" onClick={() => openSettings('general' as SettingWindowTab)}>
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 白板功能卡片 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="mr-2 h-5 w-5" />
              智能白板
            </CardTitle>
            <CardDescription>
              绘制草图并获取AI分析和建议
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm">
              使用我们的智能白板工具，您可以快速绘制草图，并通过AI获取即时分析和反馈。适用于头脑风暴、计划和协作。
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full justify-between" 
              onClick={() => navigate('/whiteboard')}
            >
              开始使用
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* 聊天功能卡片 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              AI 聊天助手
            </CardTitle>
            <CardDescription>
              与AI助手交流获取帮助
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm">
              我们的AI聊天助手可以回答您的问题，提供信息，并帮助您完成各种任务。支持文本和语音交互方式。
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full justify-between" 
              variant="outline"
              onClick={() => navigate('/')}
            >
              即将推出
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* 更多工具卡片 - 可根据需求扩展 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>更多工具</CardTitle>
            <CardDescription>
              即将推出的功能
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm">
              我们正在开发更多创新功能，敬请期待。如有功能建议，请通过设置页面联系我们。
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full justify-between" 
              variant="secondary"
              onClick={() => openSettings('general' as SettingWindowTab)}
            >
              查看设置
              <Settings className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </main>

      {/* 页面底部 */}
      <footer className="mt-6 text-center text-sm text-muted-foreground">
        <p>© 2023 Lumos Studio - AI增强创意工具</p>
      </footer>
    </div>
  );
};

export default HomePage; 