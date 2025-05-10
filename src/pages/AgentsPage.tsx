import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MastraAPI } from '@/api/mastra';
import { agentService } from '@/api/AgentService';
import { 
  MessageSquare, Plus, Settings, Trash2, Download, ExternalLink, Bot,
  Info, AlertCircle 
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Agent } from '@/api/types';

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);
  const [systemAgents, setSystemAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // 加载智能体列表
  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取所有智能体
      const allAgents = await agentService.getAllAgents();
      setAgents(allAgents);
      
      // 分类智能体
      const local = allAgents.filter(agent => !agent.systemAgent);
      const system = allAgents.filter(agent => agent.systemAgent);
      
      setLocalAgents(local);
      setSystemAgents(system);
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError('无法加载智能体列表，请检查Mastra服务是否正常运行。');
      
      // 使用默认智能体
      const defaultAgent: Agent = {
        id: 'general-assistant',
        name: '通用助手',
        description: '基础AI助手，可以回答问题和提供帮助。',
        systemAgent: true
      };
      
      setAgents([defaultAgent]);
      setSystemAgents([defaultAgent]);
    } finally {
      setLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    fetchAgents();
  }, []);

  // 开始聊天
  const startChat = (agentId: string) => {
    navigate(`/chat?agentId=${agentId}`);
  };

  // 编辑智能体
  const editAgent = (agentId: string) => {
    navigate(`/agent-editor?id=${agentId}`);
  };

  // 创建新智能体
  const createNewAgent = () => {
    navigate('/agent-editor?id=new');
  };

  // 确认删除智能体
  const confirmDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  // 执行删除
  const deleteAgent = () => {
    if (agentToDelete) {
      agentService.deleteAgent(agentToDelete.id);
      fetchAgents(); // 重新加载列表
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    }
  };

  // 导出智能体配置
  const exportAgent = (id: string) => {
    const agentConfig = agentService.exportAgent(id);
    if (agentConfig) {
      const blob = new Blob([agentConfig], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 获取要显示的智能体列表
  const getDisplayAgents = () => {
    switch (activeTab) {
      case 'local':
        return localAgents;
      case 'system':
        return systemAgents;
      case 'all':
      default:
        return agents;
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">智能体</h1>
          <p className="text-muted-foreground">管理和使用自定义智能体</p>
        </div>
        <Button onClick={createNewAgent}>
          <Plus className="mr-2 h-4 w-4" />
          创建智能体
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="local">
              本地
              {localAgents.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {localAgents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system">
              系统
              {systemAgents.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {systemAgents.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" onClick={fetchAgents}>
            刷新
          </Button>
        </div>

        <TabsContent value="all" className="mt-0">
          <AgentList 
            agents={getDisplayAgents()} 
            loading={loading}
            onChat={startChat}
            onEdit={editAgent}
            onDelete={confirmDeleteAgent}
            onExport={exportAgent}
          />
        </TabsContent>
        
        <TabsContent value="local" className="mt-0">
          <AgentList 
            agents={getDisplayAgents()} 
            loading={loading}
            onChat={startChat}
            onEdit={editAgent}
            onDelete={confirmDeleteAgent}
            onExport={exportAgent}
          />
        </TabsContent>
        
        <TabsContent value="system" className="mt-0">
          <AgentList 
            agents={getDisplayAgents()} 
            loading={loading}
            onChat={startChat}
            onEdit={null} // 系统智能体不可编辑
            onDelete={null} // 系统智能体不可删除
            onExport={null} // 系统智能体不可导出
          />
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除智能体 "{agentToDelete?.name}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={deleteAgent}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导入智能体对话框 */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden">导入</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入智能体</DialogTitle>
            <DialogDescription>
              上传智能体配置文件
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input type="file" accept=".json" />
          </div>
          <DialogFooter>
            <Button type="submit">导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AgentListProps {
  agents: Agent[];
  loading: boolean;
  onChat: (id: string) => void;
  onEdit: ((id: string) => void) | null;
  onDelete: ((agent: Agent) => void) | null;
  onExport: ((id: string) => void) | null;
}

const AgentList: React.FC<AgentListProps> = ({ 
  agents, loading, onChat, onEdit, onDelete, onExport 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">没有找到智能体</h3>
        <p className="text-muted-foreground mb-4">
          当前分类没有可用的智能体。您可以创建一个新的智能体或切换到其他分类。
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map(agent => (
        <Card key={agent.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>
                    {agent.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                  {agent.avatar && <AvatarImage src={agent.avatar} alt={agent.name} />}
                </Avatar>
                <CardTitle className="text-xl">{agent.name}</CardTitle>
              </div>
              {agent.systemAgent && (
                <Badge variant="secondary">系统</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <CardDescription className="line-clamp-3">
              {agent.description}
            </CardDescription>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button 
              variant="default" 
              className="flex-1 mr-2"
              onClick={() => onChat(agent.id)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              开始对话
            </Button>
            
            <div className="flex">
              {!agent.systemAgent && onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(agent.id)}
                  title="编辑"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              
              {!agent.systemAgent && onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(agent)}
                  className="ml-2"
                  title="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              {!agent.systemAgent && onExport && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onExport(agent.id)}
                  className="ml-2"
                  title="导出"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AgentsPage; 