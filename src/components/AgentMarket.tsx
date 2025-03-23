import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Download, Star, Filter, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Skeleton } from './ui/skeleton';

// 智能体模板类型
interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar?: string;
  tags: string[];
  author: string;
  rating: number;
  downloads: number;
  isInstalled?: boolean;
}

// 示例智能体模板数据
const sampleAgentTemplates: AgentTemplate[] = [
  {
    id: 'weather-assistant',
    name: '天气助手',
    description: '提供精确的天气信息和预报，可连接到天气API获取实时数据',
    category: '工具',
    avatar: '/agents/weather.png',
    tags: ['天气', 'API', '实用工具'],
    author: 'Mastra Team',
    rating: 4.8,
    downloads: 1250
  },
  {
    id: 'creative-writer',
    name: '创意写作',
    description: '帮助创作文章、小说、诗歌等创意内容，提供写作灵感和建议',
    category: '创意',
    avatar: '/agents/writer.png',
    tags: ['写作', '创意', '内容创作'],
    author: 'AI Writer Studio',
    rating: 4.7,
    downloads: 2300
  },
  {
    id: 'code-assistant',
    name: '代码助手',
    description: '针对多种编程语言的开发辅助工具，提供代码示例和调试帮助',
    category: '开发',
    avatar: '/agents/coder.png', 
    tags: ['编程', '开发', '代码'],
    author: 'Dev Tools Inc',
    rating: 4.9,
    downloads: 5600
  },
  {
    id: 'research-agent',
    name: '研究助手',
    description: '帮助进行学术研究、文献综述和数据分析，提供引用格式化',
    category: '学术',
    avatar: '/agents/research.png',
    tags: ['研究', '学术', '分析'],
    author: 'Academic AI Labs',
    rating: 4.6,
    downloads: 980
  },
  {
    id: 'customer-support',
    name: '客户服务',
    description: '专业的客户支持代表，处理常见问题并提供技术支持',
    category: '商业',
    avatar: '/agents/support.png',
    tags: ['客服', '支持', '企业'],
    author: 'Business Solutions',
    rating: 4.5,
    downloads: 1850
  },
  {
    id: 'travel-planner',
    name: '旅行规划师',
    description: '帮助规划旅行路线、推荐景点、餐厅和住宿',
    category: '生活',
    avatar: '/agents/travel.png',
    tags: ['旅行', '规划', '推荐'],
    author: 'Travel AI',
    rating: 4.4,
    downloads: 1560
  }
];

// 类别列表
const categories = ['全部', '工具', '创意', '开发', '学术', '商业', '生活'];

// Update the component interface to include the new prop
interface AgentMarketProps {
  onSelectAgent?: (agentId: string, agentName: string) => void;
  mode?: 'explore' | 'manage'; // 添加模式属性，支持探索和管理两种模式
}

// Update the component to accept props
const AgentMarket: React.FC<AgentMarketProps> = ({ onSelectAgent, mode = 'explore' }) => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState(mode === 'manage' ? 'installed' : 'discover');

  // 模拟API加载数据
  useEffect(() => {
    const loadData = async () => {
      // 实际应用中应该从API获取数据
      setLoading(true);
      setTimeout(() => {
        setTemplates(sampleAgentTemplates);
        setFilteredTemplates(sampleAgentTemplates);
        setLoading(false);
      }, 1000);
    };

    loadData();
  }, []);

  // 处理搜索和过滤
  useEffect(() => {
    if (templates.length === 0) return;

    let results = [...templates];
    
    // 应用搜索过滤
    if (searchQuery) {
      results = results.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // 应用类别过滤
    if (activeCategory !== 'all') {
      results = results.filter(template => template.category === activeCategory);
    }
    
    setFilteredTemplates(results);
  }, [searchQuery, activeCategory, templates]);

  // 处理智能体安装或选择
  const handleAgentInstall = (template: AgentTemplate) => {
    // 复制模板列表
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, isInstalled: !t.isInstalled } : t
    );
    setTemplates(updatedTemplates);
    
    // 调用外部回调函数
    if (onSelectAgent) {
      if (mode === 'manage') {
        onSelectAgent(template.id, template.name);
      } else {
        onSelectAgent(template.id, template.name);
      }
    }
  };

  // 渲染加载占位符
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card key={`skeleton-${index}`} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <Skeleton className="h-24 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === 'manage' ? '智能体管理' : '智能体市场'}
        </h1>
        <p className="text-muted-foreground">
          {mode === 'manage' 
            ? '管理您已安装的智能体或浏览新的智能体模板' 
            : '发现并安装预配置的智能体模板'}
        </p>
      </div>

      {/* 搜索和过滤器 */}
      <div className="p-4 border-b">
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
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
            >
              全部
            </Button>
            {['工具', '创意', '学习', '助手', '专业'].map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="discover">发现</TabsTrigger>
              <TabsTrigger value="installed">已安装</TabsTrigger>
            </TabsList>
          </div>
          
          {/* 发现标签页 */}
          <TabsContent value="discover" className="flex-1 overflow-auto p-4">
            {loading ? (
              renderSkeletons()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates
                  .filter(t => !t.isInstalled)
                  .map(template => (
                    <Card key={template.id} className="overflow-hidden flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Avatar className="h-10 w-10">
                            {template.avatar ? (
                              <AvatarImage src={template.avatar} alt={template.name} />
                            ) : (
                              <AvatarFallback>{template.name.substring(0, 2)}</AvatarFallback>
                            )}
                          </Avatar>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <CardTitle className="mt-2">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 flex-1">
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center border-t pt-3 pb-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 mr-1 fill-yellow-500 text-yellow-500" />
                          <span className="mr-3">{template.rating}</span>
                          <Download className="h-3.5 w-3.5 mr-1" />
                          <span>{template.downloads}</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAgentInstall(template)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> 
                          {mode === 'manage' ? '安装' : '安装'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
          
          {/* 已安装标签页 */}
          <TabsContent value="installed" className="flex-1 overflow-auto p-4">
            {loading ? (
              renderSkeletons()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates
                  .filter(t => t.isInstalled)
                  .map(template => (
                    <Card key={template.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Avatar className="h-10 w-10">
                            {template.avatar ? (
                              <AvatarImage src={template.avatar} alt={template.name} />
                            ) : (
                              <AvatarFallback>{template.name.substring(0, 2)}</AvatarFallback>
                            )}
                          </Avatar>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <CardTitle className="mt-2">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center border-t pt-3 pb-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 mr-1 fill-yellow-500 text-yellow-500" />
                          <span>{template.rating}</span>
                        </div>
                        <div className="flex gap-2">
                          {mode === 'manage' ? (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => onSelectAgent && onSelectAgent(template.id, template.name)}
                            >
                              编辑
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAgentInstall(template)}
                            >
                              卸载
                            </Button>
                          )}
                          {mode !== 'manage' && (
                            <Button 
                              size="sm" 
                              onClick={() => onSelectAgent && onSelectAgent(template.id, template.name)}
                            >
                              使用
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentMarket; 