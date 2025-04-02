import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";

import { pluginManager } from '../plugins/PluginManager';
import { Plugin, PluginStatus, PluginDefinition } from '../api/types/plugin';
import { 
  fileSystemPluginDefinition, 
  networkPluginDefinition,
  databasePluginDefinition,
  toolPluginDefinition
} from '../plugins';

// 模拟插件数据
const mockPlugins = [
  {
    id: 'file-system-plugin',
    name: '文件系统插件',
    description: '提供文件读写和管理功能',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.5,
    downloads: 1250,
    status: PluginStatus.Installed,
    isInstalled: true,
    category: '核心插件',
    icon: '📁',
    createdAt: new Date('2023-06-15').toISOString(),
    updatedAt: new Date('2023-07-20').toISOString()
  },
  {
    id: 'network-plugin',
    name: '网络请求插件',
    description: '提供HTTP请求和WebSocket连接功能',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.8,
    downloads: 980,
    status: PluginStatus.Active,
    isInstalled: true,
    category: '核心插件',
    icon: '🌐',
    createdAt: new Date('2023-06-15').toISOString(),
    updatedAt: new Date('2023-07-10').toISOString()
  },
  {
    id: 'database-plugin',
    name: '数据库插件',
    description: '提供数据存储和查询功能',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.6,
    downloads: 850,
    status: PluginStatus.Inactive,
    isInstalled: true,
    category: '核心插件',
    icon: '💾',
    createdAt: new Date('2023-06-20').toISOString(),
    updatedAt: new Date('2023-07-15').toISOString()
  },
  {
    id: 'tool-plugin',
    name: '工具插件',
    description: '提供各种实用工具，扩展智能体能力',
    version: '1.0.0',
    author: 'Lumos团队',
    rating: 4.7,
    downloads: 1100,
    status: PluginStatus.Installed,
    isInstalled: true,
    category: '核心插件',
    icon: '🔧',
    createdAt: new Date('2023-06-25').toISOString(),
    updatedAt: new Date('2023-07-25').toISOString()
  },
  {
    id: 'code-interpreter-plugin',
    name: '代码解释器插件',
    description: '允许执行Python、JavaScript等代码',
    version: '0.9.0',
    author: '开源社区',
    rating: 4.2,
    downloads: 720,
    status: PluginStatus.Installed,
    isInstalled: false,
    category: '开发工具',
    icon: '💻',
    createdAt: new Date('2023-07-05').toISOString(),
    updatedAt: new Date('2023-07-30').toISOString()
  },
  {
    id: 'image-generation-plugin',
    name: '图像生成插件',
    description: '根据文本描述生成图像',
    version: '0.8.5',
    author: 'AI创新实验室',
    rating: 4.9,
    downloads: 1500,
    status: PluginStatus.Installed,
    isInstalled: false,
    category: '创意工具',
    icon: '🎨',
    createdAt: new Date('2023-07-10').toISOString(),
    updatedAt: new Date('2023-08-05').toISOString()
  },
  {
    id: 'pdf-extractor-plugin',
    name: 'PDF提取插件',
    description: '从PDF文件中提取文本和结构化数据',
    version: '1.2.0',
    author: '文档处理团队',
    rating: 4.3,
    downloads: 950,
    status: PluginStatus.Installed,
    isInstalled: false,
    category: '文档处理',
    icon: '📄',
    createdAt: new Date('2023-06-30').toISOString(),
    updatedAt: new Date('2023-08-01').toISOString()
  },
  {
    id: 'translation-plugin',
    name: '多语言翻译插件',
    description: '支持超过50种语言的实时翻译',
    version: '2.0.1',
    author: '语言学习中心',
    rating: 4.6,
    downloads: 1350,
    status: PluginStatus.Installed,
    isInstalled: false,
    category: '语言工具',
    icon: '🌍',
    createdAt: new Date('2023-07-15').toISOString(),
    updatedAt: new Date('2023-08-10').toISOString()
  }
];

// 插件详情组件
const PluginDetail: React.FC<{ 
  plugin: any, 
  onClose: () => void, 
  onInstall: () => void, 
  onUninstall: () => void, 
  onEnable: () => void, 
  onDisable: () => void 
}> = ({ 
  plugin, 
  onClose, 
  onInstall, 
  onUninstall, 
  onEnable, 
  onDisable 
}) => {
  
  const getActionButton = () => {
    if (!plugin.isInstalled) {
      return (
        <Button 
          onClick={onInstall}
          className="ml-auto"
        >
          <Download className="mr-2 h-4 w-4" /> 安装
        </Button>
      );
    } else if (plugin.status === PluginStatus.Active) {
      return (
        <Button 
          variant="outline" 
          onClick={onDisable}
          className="ml-auto"
        >
          <XCircle className="mr-2 h-4 w-4" /> 禁用
        </Button>
      );
    } else {
      return (
        <Button 
          variant="outline" 
          onClick={onEnable}
          className="ml-auto"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> 启用
        </Button>
      );
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="mr-2">{plugin.icon}</span> {plugin.name}
            <Badge variant="outline" className="ml-2">v{plugin.version}</Badge>
            {plugin.isInstalled && (
              <Badge 
                variant={plugin.status === PluginStatus.Active ? "default" : "secondary"}
                className={`ml-2 ${plugin.status === PluginStatus.Active ? "bg-green-100 text-green-800" : ""}`}
              >
                {plugin.status === PluginStatus.Active ? "已启用" : "已禁用"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {plugin.description}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">作者</h3>
              <p>{plugin.author}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">分类</h3>
              <p>{plugin.category}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">评分</h3>
              <div className="flex items-center">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {i < Math.floor(plugin.rating) ? "★" : (i < plugin.rating ? "★" : "☆")}
                    </span>
                  ))}
                </div>
                <span className="ml-2">({plugin.rating})</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">下载次数</h3>
              <p>{plugin.downloads}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">创建日期</h3>
              <p>{new Date(plugin.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">更新日期</h3>
              <p>{new Date(plugin.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h3 className="text-base font-medium mb-2">插件功能</h3>
            <p className="text-sm text-muted-foreground mb-2">本插件提供以下功能：</p>
            <ul className="space-y-2">
              <li className="flex flex-col">
                <span className="font-medium">集成到智能体工具中</span>
                <span className="text-sm text-muted-foreground">允许智能体直接调用此插件提供的功能</span>
              </li>
              <li className="flex flex-col">
                <span className="font-medium">扩展系统能力</span>
                <span className="text-sm text-muted-foreground">为应用程序增加新的功能和能力</span>
              </li>
              <li className="flex flex-col">
                <span className="font-medium">用户界面集成</span>
                <span className="text-sm text-muted-foreground">可选择性地提供用户界面元素</span>
              </li>
            </ul>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex justify-between items-center">
          {plugin.isInstalled && (
            <Button 
              variant="destructive" 
              onClick={onUninstall}
            >
              <Trash2 className="mr-2 h-4 w-4" /> 卸载
            </Button>
          )}
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={onClose}
            >
              关闭
            </Button>
            {getActionButton()}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 插件卡片组件
const PluginCard: React.FC<{ plugin: any, onClick: () => void }> = ({ plugin, onClick }) => {
  return (
    <Card 
      className="h-full transition-all hover:shadow-lg cursor-pointer hover:-translate-y-1"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 bg-primary/10 mr-2">
              <AvatarFallback className="text-lg">{plugin.icon}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{plugin.name}</CardTitle>
              <CardDescription className="text-xs">v{plugin.version} · {plugin.author}</CardDescription>
            </div>
          </div>
          {plugin.isInstalled && (
            <Badge 
              variant={plugin.status === PluginStatus.Active ? "default" : "secondary"} 
              className={`ml-auto ${plugin.status === PluginStatus.Active ? "bg-green-100 text-green-800" : ""}`}
            >
              {plugin.status === PluginStatus.Active ? "已启用" : "已禁用"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{plugin.description}</p>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <div className="flex text-amber-400 text-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>
              {i < Math.floor(plugin.rating) ? "★" : (i < plugin.rating ? "★" : "☆")}
            </span>
          ))}
          <span className="ml-1 text-muted-foreground">({plugin.rating})</span>
        </div>
        <span className="text-xs text-muted-foreground">{plugin.downloads} 下载</span>
      </CardFooter>
    </Card>
  );
};

// 插件市场页面
const PluginMarketPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<any | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 加载插件列表
  const loadPlugins = async () => {
    try {
      setLoading(true);
      
      // 获取已安装的插件
      const installedPlugins = pluginManager.getAllPlugins();
      
      // 合并模拟市场数据和已安装的插件数据
      const allPlugins = [...mockPlugins];
      
      // 用真实插件数据更新模拟数据的状态
      installedPlugins.forEach(installedPlugin => {
        const index = allPlugins.findIndex(p => p.id === (installedPlugin as any).manifest?.id);
        if (index !== -1) {
          allPlugins[index] = {
            ...allPlugins[index],
            isInstalled: true,
            status: installedPlugin.status || PluginStatus.Installed
          };
        }
      });
      
      setPlugins(allPlugins);
    } catch (error) {
      console.error('加载插件失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPlugins();
  }, []);
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  const handleCardClick = (plugin: any) => {
    setSelectedPlugin(plugin);
  };
  
  const handleDetailClose = () => {
    setSelectedPlugin(null);
  };
  
  const handleInstall = async () => {
    if (selectedPlugin) {
      try {
        // 从模拟数据中查找对应的插件定义
        const pluginDefinition = [
          fileSystemPluginDefinition, 
          networkPluginDefinition, 
          databasePluginDefinition, 
          toolPluginDefinition
        ].find(p => p.manifest.id === selectedPlugin.id);
        
        if (pluginDefinition) {
          // 调用插件管理器安装插件
          await pluginManager.installPlugin(pluginDefinition);
          
          // 更新UI状态
          const updatedPlugins = plugins.map(p => 
            p.id === selectedPlugin.id 
              ? { ...p, isInstalled: true, status: PluginStatus.Installed } 
              : p
          );
          setPlugins(updatedPlugins);
          setSelectedPlugin({ ...selectedPlugin, isInstalled: true, status: PluginStatus.Installed });
          
          console.log(`插件 ${selectedPlugin.name} 安装成功`);
        } else {
          console.error(`找不到插件定义: ${selectedPlugin.id}`);
        }
      } catch (error) {
        console.error(`安装插件失败: ${error}`);
      }
    }
  };
  
  const handleUninstall = async () => {
    if (selectedPlugin) {
      setConfirmMessage(`确定要卸载插件 "${selectedPlugin.name}" 吗？`);
      setConfirmAction(() => async () => {
        try {
          // 调用插件管理器卸载插件
          await pluginManager.uninstallPlugin(selectedPlugin.id);
          
          // 更新UI状态
          const updatedPlugins = plugins.map(p => 
            p.id === selectedPlugin.id 
              ? { ...p, isInstalled: false, status: PluginStatus.Installed } 
              : p
          );
          setPlugins(updatedPlugins);
          setSelectedPlugin(null);
          
          console.log(`插件 ${selectedPlugin.name} 卸载成功`);
        } catch (error) {
          console.error(`卸载插件失败: ${error}`);
        } finally {
          setConfirmDialogOpen(false);
        }
      });
      setConfirmDialogOpen(true);
    }
  };
  
  const handleEnable = async () => {
    if (selectedPlugin) {
      try {
        // 调用插件管理器启用插件
        await pluginManager.enablePlugin(selectedPlugin.id);
        
        // 更新UI状态
        const updatedPlugins = plugins.map(p => 
          p.id === selectedPlugin.id 
            ? { ...p, status: PluginStatus.Active } 
            : p
        );
        setPlugins(updatedPlugins);
        setSelectedPlugin({ ...selectedPlugin, status: PluginStatus.Active });
        
        console.log(`插件 ${selectedPlugin.name} 启用成功`);
      } catch (error) {
        console.error(`启用插件失败: ${error}`);
      }
    }
  };
  
  const handleDisable = async () => {
    if (selectedPlugin) {
      try {
        // 调用插件管理器禁用插件
        await pluginManager.disablePlugin(selectedPlugin.id);
        
        // 更新UI状态
        const updatedPlugins = plugins.map(p => 
          p.id === selectedPlugin.id 
            ? { ...p, status: PluginStatus.Inactive } 
            : p
        );
        setPlugins(updatedPlugins);
        setSelectedPlugin({ ...selectedPlugin, status: PluginStatus.Inactive });
        
        console.log(`插件 ${selectedPlugin.name} 禁用成功`);
      } catch (error) {
        console.error(`禁用插件失败: ${error}`);
      }
    }
  };
  
  // 过滤和排序插件
  const filteredPlugins = plugins.filter(plugin => {
    // 根据标签过滤
    if (activeTab === 'installed' && !plugin.isInstalled) return false;
    if (activeTab === 'active' && plugin.status !== PluginStatus.Active) return false;
    
    // 根据搜索词过滤
    if (searchQuery && !plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !plugin.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 根据分类过滤
    if (selectedCategory && plugin.category !== selectedCategory) {
      return false;
    }
    
    return true;
  });
  
  // 获取所有分类
  const categories = Array.from(new Set(plugins.map(plugin => plugin.category)));
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">插件市场</h1>
        <Button variant="ghost" size="icon" onClick={loadPlugins} disabled={loading}>
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">全部插件</TabsTrigger>
          <TabsTrigger value="installed">已安装</TabsTrigger>
          <TabsTrigger value="active">已启用</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索插件..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleCategoryChange(null)}
          >
            全部分类
          </Badge>
          {categories.map(category => (
            <Badge 
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="bg-background border rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-muted-foreground">没有找到匹配的插件</h3>
          <p className="text-sm text-muted-foreground mt-2">尝试更改搜索词或过滤条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map(plugin => (
            <PluginCard 
              key={plugin.id}
              plugin={plugin} 
              onClick={() => handleCardClick(plugin)} 
            />
          ))}
        </div>
      )}
      
      {selectedPlugin && (
        <PluginDetail 
          plugin={selectedPlugin}
          onClose={handleDetailClose}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          onEnable={handleEnable}
          onDisable={handleDisable}
        />
      )}
      
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认操作</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction()}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PluginMarketPage; 