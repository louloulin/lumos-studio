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
import { useNavigate } from 'react-router-dom';
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

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  
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
    window.location.href = '/workflow/editor/new';
  };
  
  // 编辑工作流
  const handleEditWorkflow = (id: string) => {
    window.location.href = `/workflow/editor/${id}`;
  };
  
  // 运行工作流
  const handleRunWorkflow = (id: string) => {
    window.location.href = `/workflow/run/${id}`;
  };
  
  // 删除工作流确认
  const confirmDelete = (id: string) => {
    setWorkflowToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  // 执行删除工作流
  const handleDeleteWorkflow = () => {
    if (workflowToDelete) {
      const success = workflowService.deleteWorkflow(workflowToDelete);
      
      if (success) {
        setWorkflows(prevWorkflows => 
          prevWorkflows.filter(wf => wf.id !== workflowToDelete)
        );
      } else {
        setError('删除工作流失败');
      }
      
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };
  
  // 导入工作流
  const handleImport = () => {
    if (!importJson.trim()) {
      return;
    }
    
    try {
      const imported = workflowService.importWorkflow(importJson);
      
      if (imported) {
        loadWorkflows();
        setImportDialogOpen(false);
        setImportJson('');
      } else {
        setError('导入工作流失败');
      }
    } catch (err) {
      console.error('导入工作流失败:', err);
      setError('工作流格式无效');
    }
  };
  
  // 导出工作流
  const handleExport = (id: string) => {
    const jsonData = workflowService.exportWorkflow(id);
    
    if (jsonData) {
      // 创建下载链接
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const workflow = workflows.find(w => w.id === id);
      const filename = workflow ? 
        `${workflow.name.replace(/\s+/g, '_')}_workflow.json` : 
        'workflow.json';
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
  };

  return (
    <div className="container p-4 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">工作流管理</h1>
          <p className="text-muted-foreground">创建和管理自动化工作流</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            导入工作流
          </Button>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            新建工作流
          </Button>
        </div>
      </div>
      
      <Separator className="mb-6" />
      
      {error && (
        <Alert variant="destructive" className="mb-6">
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
                <Card key={workflow.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{workflow.name}</CardTitle>
                    <CardDescription>
                      {workflow.description || '无描述'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>节点: {workflow.nodes.length}</span>
                      <span>•</span>
                      <span>连接: {workflow.edges.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      创建于: {new Date(workflow.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleRunWorkflow(workflow.id)}
                        title="执行工作流"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEditWorkflow(workflow.id)}
                        title="编辑工作流"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleExport(workflow.id)}
                      >
                        导出
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => confirmDelete(workflow.id)}
                        title="删除工作流"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
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
              您确定要删除此工作流吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorkflow}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 导入对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入工作流</DialogTitle>
            <DialogDescription>
              粘贴工作流的JSON数据以导入
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full h-40 p-2 border rounded"
              placeholder='{"name": "工作流名称", "nodes": [...], "edges": [...]}'
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImport}>
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowBuilder; 