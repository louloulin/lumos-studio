import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  Plus, Pencil, MoreVertical, Trash2, Copy, Terminal, ChevronRight, Code
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tool, toolService } from '@/api/ToolService';

export default function ToolsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDescription, setNewToolDescription] = useState('');
  
  // 加载工具列表
  useEffect(() => {
    loadTools();
  }, []);
  
  // 加载工具
  const loadTools = async () => {
    setIsLoading(true);
    try {
      const allTools = await toolService.getAllTools();
      setTools(allTools);
    } catch (error) {
      console.error('加载工具失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  
  // 过滤工具
  const filteredTools = tools.filter(tool => {
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (tool.description && tool.description.toLowerCase().includes(searchText.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'builtin') return matchesSearch && tool.isBuiltin;
    if (activeTab === 'custom') return matchesSearch && !tool.isBuiltin;
    if (activeTab === 'mastra') return matchesSearch && tool.isMastraTool;
    
    return matchesSearch;
  });
  
  // 创建新工具
  const handleCreateTool = () => {
    if (!newToolName.trim()) return;
    
    const newTool: Partial<Tool> = {
      name: newToolName,
      description: newToolDescription,
      parameters: [],
      isBuiltin: false,
      isMastraTool: false
    };
    
    const createdTool = toolService.registerCustomTool(
      newTool.name!, 
      newTool.description || '', 
      newTool.parameters || []
    );
    
    if (createdTool) {
      setTools([...tools, createdTool]);
      setShowCreateDialog(false);
      setNewToolName('');
      setNewToolDescription('');
      // 导航到工具编辑页面
      navigate(`/tools/${createdTool.id}`);
    }
  };
  
  // 编辑工具
  const handleEditTool = (id: string) => {
    navigate(`/tools/${id}`);
  };
  
  // 删除工具
  const handleDeleteTool = (id: string) => {
    if (confirm('确定要删除此工具吗？此操作无法撤销。')) {
      const success = toolService.unregisterTool(id);
      if (success) {
        setTools(tools.filter(tool => tool.id !== id));
      }
    }
  };
  
  // 复制工具
  const handleDuplicateTool = (id: string) => {
    const tool = tools.find(t => t.id === id);
    if (!tool) return;
    
    const duplicatedTool = toolService.registerCustomTool(
      `${tool.name} (副本)`,
      tool.description || '',
      [...(tool.parameters || [])]
    );
    
    if (duplicatedTool) {
      setTools([...tools, duplicatedTool]);
    }
  };
  
  // 测试工具
  const handleTestTool = (id: string) => {
    navigate(`/tools/test/${id}`);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">工具管理</h1>
          <p className="text-muted-foreground">创建和管理用于工作流的工具</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          创建工具
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">全部工具</TabsTrigger>
              <TabsTrigger value="builtin">内置工具</TabsTrigger>
              <TabsTrigger value="custom">自定义工具</TabsTrigger>
              <TabsTrigger value="mastra">Mastra工具</TabsTrigger>
            </TabsList>
            
            <Input 
              placeholder="搜索工具..." 
              className="max-w-sm"
              value={searchText}
              onChange={handleSearch}
            />
          </div>
          
          <TabsContent value="all" className="mt-6">
            {renderToolsContent(filteredTools)}
          </TabsContent>
          
          <TabsContent value="builtin" className="mt-6">
            {renderToolsContent(filteredTools)}
          </TabsContent>
          
          <TabsContent value="custom" className="mt-6">
            {renderToolsContent(filteredTools)}
          </TabsContent>
          
          <TabsContent value="mastra" className="mt-6">
            {renderToolsContent(filteredTools)}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 创建工具对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新工具</DialogTitle>
            <DialogDescription>
              输入基本信息创建新工具，创建后可以配置更多选项。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tool-name" className="text-sm font-medium">
                工具名称
              </label>
              <Input
                id="tool-name"
                placeholder="输入工具名称"
                value={newToolName}
                onChange={(e) => setNewToolName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tool-description" className="text-sm font-medium">
                工具描述
              </label>
              <Input
                id="tool-description"
                placeholder="输入工具描述"
                value={newToolDescription}
                onChange={(e) => setNewToolDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTool}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  // 渲染工具列表
  function renderToolsContent(toolsList: Tool[]) {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
          <span className="ml-2">加载中...</span>
        </div>
      );
    }
    
    if (toolsList.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-2 py-6">
              <div className="text-muted-foreground">
                {searchText ? '没有找到匹配的工具' : '没有可用的工具'}
              </div>
              <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                创建工具
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolsList.map(tool => (
          <Card key={tool.id} className={tool.isBuiltin ? 'border-blue-200' : tool.isMastraTool ? 'border-purple-200' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  {(tool.isBuiltin || tool.isMastraTool) && (
                    <div className="mt-1">
                      {tool.isBuiltin && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 mr-2">
                          内置
                        </span>
                      )}
                      {tool.isMastraTool && (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                          Mastra
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!tool.isBuiltin && !tool.isMastraTool && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>工具操作</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditTool(tool.id)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTool(tool.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        复制
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTestTool(tool.id)}>
                        <Terminal className="w-4 h-4 mr-2" />
                        测试
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => handleDeleteTool(tool.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tool.description || '无描述'}
              </p>
              {tool.parameters && tool.parameters.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium mb-2">参数:</p>
                  <ul className="text-xs space-y-1">
                    {tool.parameters.slice(0, 3).map((param, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {param.name}
                        {param.required && <span className="text-red-500">*</span>}
                        {param.description && <span className="text-muted-foreground">: {param.description.slice(0, 30)}{param.description.length > 30 ? '...' : ''}</span>}
                      </li>
                    ))}
                    {tool.parameters.length > 3 && (
                      <li className="text-muted-foreground">+ {tool.parameters.length - 3} 更多参数...</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {(tool.isBuiltin || tool.isMastraTool) ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleTestTool(tool.id)}>
                  <Terminal className="w-4 h-4 mr-2" />
                  测试工具
                </Button>
              ) : (
                <Button variant="default" size="sm" className="w-full" onClick={() => handleEditTool(tool.id)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  编辑工具
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
} 