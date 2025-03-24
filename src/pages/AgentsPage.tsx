import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { ArrowLeft, Menu, Settings, MessageSquare, Bot, Plus } from 'lucide-react';
import { useAtom } from 'jotai';
import { openSettingDialogAtom } from '../stores/atoms';
import { SettingWindowTab } from '../shared/types';
import { MastraAPI } from '../api/mastra';
import { useToast } from '../components/ui/use-toast';
import { Skeleton } from '../components/ui/skeleton';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
}

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [, setOpenSettingDialog] = useAtom(openSettingDialogAtom);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 获取智能体列表
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const agentNames = await MastraAPI.getAgents();
        
        // 转换为Agent对象数组
        const agentList: Agent[] = agentNames.map(name => ({
          id: name,
          name,
          description: `Mastra智能体: ${name}`,
          avatar: undefined
        }));
        
        // 如果列表为空，添加默认智能体
        if (agentList.length === 0) {
          agentList.push({
            id: 'generalAssistant',
            name: '通用助手',
            description: '我是一个智能助手，可以回答您的问题和提供帮助。',
            avatar: undefined
          });
        }
        
        setAgents(agentList);
      } catch (error) {
        console.error('获取智能体列表失败:', error);
        toast({
          title: '获取智能体失败',
          description: '无法获取智能体列表，请检查Mastra服务是否运行。',
          variant: 'destructive',
        });
        
        // 添加默认智能体
        setAgents([{
          id: 'generalAssistant',
          name: '通用助手',
          description: '我是一个智能助手，可以回答您的问题和提供帮助。',
          avatar: undefined
        }]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgents();
  }, [toast]);

  // 打开设置对话框
  const openSettings = (tab: SettingWindowTab) => {
    setOpenSettingDialog(tab);
  };
  
  // 启动与智能体的对话
  const startChat = (agentId: string) => {
    navigate(`/chat?agentId=${agentId}`);
  };

  return (
    <div className="flex flex-col w-full h-full tauri-window-container bg-background">
      {/* 页面头部 */}
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-4">智能体</h1>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => openSettings('general' as SettingWindowTab)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 p-4 overflow-auto">
        <ScrollArea className="h-full">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              // 加载中骨架屏
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              // 智能体列表
              agents.map(agent => (
                <Card key={agent.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bot className="mr-2 h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                    <CardDescription>
                      智能助手
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm">
                      {agent.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => startChat(agent.id)}
                    >
                      开始对话
                      <MessageSquare className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default AgentsPage; 