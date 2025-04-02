import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Download, Star, Filter, Plus, Bot, Check, Brain, 
  Zap, FileCode, Settings, Info, AlertCircle, MessageSquare 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Agent, AgentType } from '@/api/types';
import { agentService, MarketAgent } from '@/api/AgentService';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';

// 分类选项
const categories = [
  { id: 'all', name: '全部' },
  { id: 'popular', name: '热门' },
  { id: 'new', name: '最新' },
  { id: 'tools', name: '工具' },
  { id: 'creative', name: '创意' },
  { id: 'coding', name: '编程' },
  { id: 'academic', name: '学术' },
  { id: 'business', name: '商业' },
  { id: 'life', name: '生活' }
];

const AgentMarketPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态
  const [agents, setAgents] = useState<MarketAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<MarketAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [installingAgent, setInstallingAgent] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<MarketAgent | null>(null);

  // 加载市场智能体列表
  useEffect(() => {
    const fetchMarketAgents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 获取市场智能体列表
        const marketAgents = await agentService.getMarketAgents();
        // 获取已安装的智能体列表
        const installedAgents = await agentService.getAllAgents();
        
        // 标记已安装的智能体
        const agentsWithInstallStatus = marketAgents.map(agent => ({
          ...agent,
          isInstalled: installedAgents.some(installed => installed.id === agent.id)
        }));
        
        setAgents(agentsWithInstallStatus);
        setFilteredAgents(agentsWithInstallStatus);
      } catch (err) {
        console.error('Failed to load market agents:', err);
        setError('无法加载智能体市场，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketAgents();
  }, []);

  // 过滤智能体
  useEffect(() => {
    if (agents.length === 0) return;

    let results = [...agents];
    
    // 应用搜索过滤
    if (searchQuery) {
      results = results.filter(
        agent =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (agent.categories || []).some(category => 
            category.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }
    
    // 应用分类过滤
    switch (activeCategory) {
      case 'popular':
        results = results.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'new':
        results = results.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'tools':
        results = results.filter(agent => agent.type === AgentType.Tool);
        break;
      case 'creative':
        results = results.filter(agent => 
          agent.type === AgentType.Writing || agent.type === AgentType.Creative
        );
        break;
      case 'coding':
        results = results.filter(agent => agent.type === AgentType.Coding);
        break;
      case 'academic':
        results = results.filter(agent => agent.type === AgentType.Research);
        break;
      case 'business':
        results = results.filter(agent => 
          agent.categories?.includes('商业') || agent.categories?.includes('business')
        );
        break;
      case 'life':
        results = results.filter(agent => 
          agent.categories?.includes('生活') || agent.categories?.includes('life')
        );
        break;
    }
    
    setFilteredAgents(results);
  }, [searchQuery, activeCategory, agents]);

  // 安装智能体
  const handleInstallAgent = async (agent: MarketAgent) => {
    if (agent.isInstalled) {
      // 如果已安装，直接打开聊天
      navigate(`/chat?agentId=${agent.id}`);
      return;
    }

    setInstallingAgent(agent.id);
    try {
      // 安装智能体
      await agentService.installAgent(agent.id);
      
      // 更新状态
      setAgents(prev => prev.map(a => 
        a.id === agent.id ? { ...a, isInstalled: true } : a
      ));
      
      // 跳转到聊天页面
      navigate(`/chat?agentId=${agent.id}`);
    } catch (err) {
      console.error('Failed to install agent:', err);
      setError(`安装失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setInstallingAgent(null);
    }
  };

  // 打开智能体详情
  const handleOpenDetails = (agent: MarketAgent) => {
    setSelectedAgent(agent);
  };

  // 渲染智能体卡片
  const renderAgentCard = (agent: MarketAgent) => (
    <Card key={agent.id} className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={agent.avatar} alt={agent.name} />
              <AvatarFallback>
                {agent.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 fill-yellow-400 stroke-yellow-400" />
                  {agent.rating.toFixed(1)}
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  {agent.downloads}
                </div>
              </div>
            </div>
          </div>
          {agent.isInstalled && (
            <Badge variant="secondary">已安装</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-2 mb-2">
          {agent.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{agent.type}</Badge>
          {agent.categories?.slice(0, 2).map(category => (
            <Badge key={category} variant="outline">{category}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button 
          variant={agent.isInstalled ? "secondary" : "default"}
          className="flex-1 mr-2"
          onClick={() => handleInstallAgent(agent)}
          disabled={installingAgent === agent.id}
        >
          {installingAgent === agent.id ? (
            <>
              <Skeleton className="h-4 w-4 mr-2" />
              安装中...
            </>
          ) : agent.isInstalled ? (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              开始对话
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              安装
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleOpenDetails(agent)}
        >
          <Info className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">智能体市场</h1>
          <p className="text-muted-foreground">发现和安装预配置的智能体</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/agents/create')}>
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

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索智能体..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-auto pb-1">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card className="p-8 flex flex-col items-center justify-center text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">没有找到智能体</h3>
          <p className="text-muted-foreground mb-4">
            尝试使用不同的搜索词或浏览其他分类。
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setActiveCategory('all');
          }}>
            清除筛选
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map(renderAgentCard)}
        </div>
      )}

      {/* 智能体详情对话框 */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedAgent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedAgent.avatar} alt={selectedAgent.name} />
                    <AvatarFallback>
                      {selectedAgent.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">{selectedAgent.name}</DialogTitle>
                    <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 stroke-yellow-400" />
                        {selectedAgent.rating.toFixed(1)}
                      </div>
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        {selectedAgent.downloads} 次安装
                      </div>
                      {selectedAgent.author && (
                        <div>作者: {selectedAgent.author}</div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">描述</h3>
                  <p className="text-muted-foreground">
                    {selectedAgent.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">分类</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{selectedAgent.type}</Badge>
                    {selectedAgent.categories?.map(category => (
                      <Badge key={category} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </div>

                {selectedAgent.examples && selectedAgent.examples.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-1">示例问题</h3>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {selectedAgent.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-1">模型配置</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{selectedAgent.model}</Badge>
                    <Badge>温度: {selectedAgent.temperature || 0.7}</Badge>
                    <Badge>最大令牌: {selectedAgent.maxTokens || 4000}</Badge>
                  </div>
                </div>

                {selectedAgent.version && (
                  <div>
                    <h3 className="font-medium mb-1">版本信息</h3>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div>版本: {selectedAgent.version}</div>
                      <div>更新时间: {new Date(selectedAgent.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant={selectedAgent.isInstalled ? "secondary" : "default"}
                  onClick={() => handleInstallAgent(selectedAgent)}
                  disabled={installingAgent === selectedAgent.id}
                  className="w-full"
                >
                  {installingAgent === selectedAgent.id ? (
                    <>
                      <Skeleton className="h-4 w-4 mr-2" />
                      安装中...
                    </>
                  ) : selectedAgent.isInstalled ? (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      开始对话
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      安装智能体
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentMarketPage; 