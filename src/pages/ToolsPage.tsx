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
  Plus, Pencil, MoreVertical, Trash2, Copy, Terminal, ChevronRight, Code, ArrowLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tool, toolService } from '@/api/ToolService';

// 检测是否在Tauri环境中运行
const isTauriApp = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

export default function ToolsPage() {
  console.log("工具页面已加载 - 检测Tauri环境:", isTauriApp ? "是" : "否");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDescription, setNewToolDescription] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // 加载工具列表
  useEffect(() => {
    console.log("开始加载工具");
    loadTools();
    
    // 监听导航事件
    const handleNavigation = () => {
      console.log("导航变化检测 - 当前路径:", window.location.pathname);
    };

    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);
  
  // 加载工具
  const loadTools = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      console.log("正在从工具服务获取工具");
      // 添加延迟确保Tauri环境有足够时间初始化
      if (isTauriApp) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const allTools = await toolService.getAllTools();
      console.log("获取到工具数量:", allTools.length);
      setTools(allTools);
    } catch (error) {
      console.error('加载工具失败:', error);
      setLoadError(error instanceof Error ? error.message : '未知错误');
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
    if (activeTab === 'custom') return matchesSearch && tool.isCustom;
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
  
  // 返回首页
  const handleGoBack = () => {
    console.log("返回首页");
    navigate('/');
  };
  
  // 重试加载
  const handleRetry = () => {
    console.log("重试加载工具");
    loadTools();
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <span className="font-bold">工具管理</span>
          </div>
        </div>
      </header>
      <main className="flex-1">
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
          
          {loadError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-1">加载工具时出错: {loadError}</div>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  重试
                </Button>
              </div>
            </div>
          )}
          
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
      </main>
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
      <div className="grid gap-4">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>参数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolsList.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell>{tool.description}</TableCell>
                    <TableCell>
                      {tool.isBuiltin
                        ? '内置工具'
                        : tool.isMastraTool
                        ? 'Mastra工具'
                        : '自定义工具'}
                    </TableCell>
                    <TableCell>{tool.parameters?.length || 0} 个参数</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>工具操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditTool(tool.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTestTool(tool.id)}>
                            <Terminal className="mr-2 h-4 w-4" />
                            测试
                          </DropdownMenuItem>
                          {!tool.isBuiltin && !tool.isMastraTool && (
                            <>
                              <DropdownMenuItem onClick={() => handleDuplicateTool(tool.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                复制
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTool(tool.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }
} 