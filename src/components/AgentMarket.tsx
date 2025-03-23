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
}

// Update the component to accept props
const AgentMarket: React.FC<AgentMarketProps> = ({ onSelectAgent }) => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeTab, setActiveTab] = useState('discover');

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
    if (searchTerm) {
      results = results.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 应用类别过滤
    if (activeCategory !== '全部') {
      results = results.filter(template => template.category === activeCategory);
    }
    
    setFilteredTemplates(results);
  }, [searchTerm, activeCategory, templates]);

  // Add a handler for agent selection that uses the prop
  const handleAgentInstall = (template: AgentTemplate) => {
    // Existing install logic
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, isInstalled: true } : t
    );
    setTemplates(updatedTemplates);
    
    // Add callback to parent component
    if (onSelectAgent) {
      onSelectAgent(template.id, template.name);
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
    <div className="flex flex-col h-full p-6 bg-background overflow-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">智能体市场</h1>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" /> 创建自定义智能体
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索智能体模板..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="discover" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">发现</TabsTrigger>
            <TabsTrigger value="installed">已安装</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <TabsContent value="discover" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                renderSkeletons()
              ) : (
                filteredTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          {template.avatar ? (
                            <AvatarImage src={template.avatar} alt={template.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {template.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs">
                            作者: {template.author}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm line-clamp-3">{template.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center mt-3 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                        <span className="mr-3">{template.rating}</span>
                        <Download className="h-3 w-3 mr-1" />
                        <span>{template.downloads}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={template.isInstalled ? "outline" : "default"}
                        onClick={() => handleAgentInstall(template)}
                        disabled={template.isInstalled}
                      >
                        {template.isInstalled ? "已安装" : "安装"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
              {!loading && filteredTemplates.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">没有找到匹配的智能体模板</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveCategory('全部');
                    }}
                  >
                    重置筛选条件
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="installed" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                renderSkeletons()
              ) : (
                templates
                  .filter((template) => template.isInstalled)
                  .map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            {template.avatar ? (
                              <AvatarImage src={template.avatar} alt={template.name} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {template.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-xs">
                              作者: {template.author}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm line-clamp-3">{template.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" variant="outline">
                          配置
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              )}
              {!loading && templates.filter((t) => t.isInstalled).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-2">您还没有安装任何智能体</p>
                  <Button variant="outline" onClick={() => setActiveTab('discover')}>
                    浏览智能体市场
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentMarket; 