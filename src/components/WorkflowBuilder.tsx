import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Workflow, workflowService } from '@/api/WorkflowService';
import { Plus, PlusCircle, Edit, Play, Trash } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  MoreVertical, 
  Trash2, 
  Share2,
  AlertCircle
} from 'lucide-react';

// 在应用内打开工作流编辑器和运行页面
interface WorkflowBuilderProps {
  onOpenEditor?: (id: string) => void;
  onOpenRunner?: (id: string) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onOpenEditor, onOpenRunner }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  
  // 初始化时加载工作流列表
  useEffect(() => {
    loadWorkflows();
  }, []);
  
  // 加载工作流
  const loadWorkflows = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedWorkflows = workflowService.getWorkflows();
      setWorkflows(loadedWorkflows);
    } catch (err) {
      console.error('加载工作流失败:', err);
      setError('加载工作流失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 创建新工作流
  const handleCreateWorkflow = () => {
    setCreateDialogOpen(true);
  };
  
  // 确认创建新工作流
  const confirmCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    
    const newWorkflow = workflowService.createWorkflow({
      name: newWorkflowName,
      description: newWorkflowDescription,
      nodes: [],
      edges: []
    });
    
    setWorkflows(prev => [newWorkflow, ...prev]);
    setCreateDialogOpen(false);
    setNewWorkflowName('');
    setNewWorkflowDescription('');
    
    // 如果提供了编辑器打开回调函数，则调用它
    if (onOpenEditor) {
      onOpenEditor(newWorkflow.id);
    }
  };
  
  // 编辑工作流
  const handleEditWorkflow = (id: string) => {
    if (onOpenEditor) {
      onOpenEditor(id);
    } else {
      // 如果没有提供回调，则使用默认行为
      console.log('工作流编辑器打开回调未提供');
    }
  };
  
  // 运行工作流
  const handleRunWorkflow = (id: string) => {
    if (onOpenRunner) {
      onOpenRunner(id);
    } else {
      // 如果没有提供回调，则使用默认行为
      console.log('工作流运行器打开回调未提供');
    }
  };
  
  // 删除工作流
  const handleDeleteWorkflow = (id: string) => {
    setWorkflowToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  // 确认删除工作流
  const confirmDeleteWorkflow = () => {
    if (workflowToDelete) {
      workflowService.deleteWorkflow(workflowToDelete);
      setWorkflows(prev => prev.filter(w => w.id !== workflowToDelete));
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };
  
  // 导入工作流
  const handleImportWorkflow = () => {
    setImportDialogOpen(true);
  };
  
  // 确认导入工作流
  const confirmImportWorkflow = () => {
    try {
      const importedWorkflow = workflowService.importWorkflow(importJson);
      if (importedWorkflow) {
        setWorkflows(prev => [importedWorkflow, ...prev]);
        setImportDialogOpen(false);
        setImportJson('');
      } else {
        throw new Error('导入失败');
      }
    } catch (err) {
      console.error('导入工作流失败:', err);
      setError('导入工作流失败，请检查JSON格式是否正确');
    }
  };
  
  // 导出工作流
  const handleExportWorkflow = (id: string) => {
    const exportedJson = workflowService.exportWorkflow(id);
    if (exportedJson) {
      // 创建下载链接
      const blob = new Blob([exportedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const workflow = workflows.find(w => w.id === id);
      a.href = url;
      a.download = `${workflow?.name || 'workflow'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <div className="space-y-6 py-4">
      {/* 顶部按钮和标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">工作流管理</h1>
          <p className="text-muted-foreground">创建和管理自动化工作流程</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            创建工作流
          </Button>
          <Button variant="outline" onClick={handleImportWorkflow}>
            <Share2 className="w-4 h-4 mr-2" />
            导入工作流
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="min-h-[100px] bg-gray-100 dark:bg-gray-800"></CardHeader>
              <CardContent className="mt-4">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-800 w-1/2"></div>
              </CardContent>
              <CardFooter>
                <div className="h-8 bg-gray-100 dark:bg-gray-800 w-full rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-center">
              <div className="mb-4 p-4 rounded-full bg-muted">
                <PlusCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">暂无工作流</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                工作流允许您自动化一系列任务，将多个智能体和工具组合在一起以实现更复杂的功能。
              </p>
              <Button onClick={handleCreateWorkflow}>
                <Plus className="mr-2 h-4 w-4" />
                创建您的第一个工作流
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map(workflow => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <CardTitle>{workflow.name}</CardTitle>
                    <CardDescription>
                      创建于 {new Date(workflow.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.description || '无描述'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {workflow.tags?.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => handleRunWorkflow(workflow.id)}>
                      <Play className="mr-2 h-4 w-4" />
                      运行
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditWorkflow(workflow.id)}>
                        <Edit className="mr-1 h-4 w-4" />
                        编辑
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleExportWorkflow(workflow.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            导出
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteWorkflow(workflow.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个工作流吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmDeleteWorkflow}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 导入工作流对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入工作流</DialogTitle>
            <DialogDescription>
              粘贴工作流JSON定义以导入。
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Textarea 
              placeholder="在此粘贴JSON..." 
              className="min-h-[200px]" 
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>取消</Button>
            <Button onClick={confirmImportWorkflow}>导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 创建工作流对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新工作流</DialogTitle>
            <DialogDescription>
              给您的新工作流起个名字和描述。
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">名称</Label>
              <Input 
                id="workflow-name" 
                placeholder="工作流名称" 
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">描述 (可选)</Label>
              <Textarea 
                id="workflow-description" 
                placeholder="描述此工作流的用途和功能..." 
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button onClick={confirmCreateWorkflow}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowBuilder; 