import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { PenTool, ArrowRight, Settings, MessageSquare, Bot } from 'lucide-react';
import AgentModels from '../components/AgentModels';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full h-full tauri-window-container p-4 overflow-auto bg-background">
      {/* 页面头部 */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lumos Studio</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* 功能卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* 工作流卡片 */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>工作流</CardTitle>
            <CardDescription>
              创建和管理自动化工作流
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              构建强大的工作流，自动化处理任务，将多个智能体连接起来解决复杂问题。
            </p>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center mb-2">
                <PenTool className="h-4 w-4 mr-2 text-primary" />
                <span>可视化设计</span>
              </div>
              <div className="flex items-center mb-2">
                <Bot className="h-4 w-4 mr-2 text-primary" />
                <span>集成多种AI模型</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                <span>处理复杂对话</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/workflow')}>
              进入工作流
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* 工具卡片 */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>工具管理</CardTitle>
            <CardDescription>
              创建和管理自定义工具
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              开发自定义工具，扩展工作流功能，实现更复杂的自动化需求。
            </p>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center mb-2">
                <PenTool className="h-4 w-4 mr-2 text-primary" />
                <span>JavaScript工具开发</span>
              </div>
              <div className="flex items-center mb-2">
                <Bot className="h-4 w-4 mr-2 text-primary" />
                <span>轻松集成外部API</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                <span>便捷的测试与调试</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/tools')}>
              进入工具管理
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* 智能体卡片 */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>智能体</CardTitle>
            <CardDescription>
              创建和管理AI智能体
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              创建专业化的AI智能体，赋予其专业知识和技能，解决特定领域的问题。
            </p>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center mb-2">
                <PenTool className="h-4 w-4 mr-2 text-primary" />
                <span>智能体定制</span>
              </div>
              <div className="flex items-center mb-2">
                <Bot className="h-4 w-4 mr-2 text-primary" />
                <span>知识库集成</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                <span>多模式交互</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/agents')}>
              进入智能体管理
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 智能体模型区域 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">智能体</h2>
        <AgentModels />
      </div>
    </div>
  );
};

export default HomePage; 