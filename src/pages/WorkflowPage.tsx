import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Workflow, workflowService } from '@/api/WorkflowService';
import { AlertCircle, Edit, Play, Plus, Trash } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const navigate = useNavigate();

  // 加载工作流
  useEffect(() => {
    fetchWorkflows();
  }, []);

  // 获取工作流列表
  const fetchWorkflows = () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedWorkflows = workflowService.getWorkflows();
      setWorkflows(loadedWorkflows);
    } catch (err) {
      console.error('加载工作流失败:', err);
      setError('加载工作流失败。请刷新页面重试。');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新工作流
  const handleCreateWorkflow = () => {
    navigate('/workflow/editor/new');
  };

  // 编辑工作流
  const handleEditWorkflow = (id: string) => {
    navigate(`/workflow/editor/${id}`);
  };

  // 执行工作流
  const handleRunWorkflow = (id: string) => {
    navigate(`/workflow/run/${id}`);
  };

  // 确认删除工作流
  const confirmDelete = (id: string) => {
    setWorkflowToDelete(id);
    setDeleteDialogOpen(true);
  };

  // 删除工作流
  const handleDeleteWorkflow = () => {
    if (workflowToDelete) {
      const success = workflowService.deleteWorkflow(workflowToDelete);
      
      if (success) {
        // 更新列表
        setWorkflows(workflows.filter(workflow => workflow.id !== workflowToDelete));
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
        fetchWorkflows();
        setImportDialogOpen(false);
        setImportJson('');
      } else {
        setError('导入工作流失败');
      }
    } catch (err) {
      console.error('导入工作流失败:', err);
      setError('导入工作流格式无效');
    }
  };

  // 导出工作流
  const handleExport = (id: string) => {
    const jsonData = workflowService.exportWorkflow(id);
    
    if (jsonData) {
      // 创建并下载文件
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const workflow = workflows.find(w => w.id === id);
      const filename = workflow ? `${workflow.name.replace(/\s+/g, '_')}_workflow.json` : 'workflow.json';
      
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">工作流</h1>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)}>导入工作流</Button>
          <Button onClick={handleCreateWorkflow} className="flex items-center gap-2">
            <Plus size={16} />
            新建工作流
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
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
        <div>
          {workflows.length === 0 ? (
            <div className="text-center p-12 border rounded-lg">
              <h3 className="text-xl font-medium mb-2">暂无工作流</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">创建您的第一个工作流以开始构建自动化流程</p>
              <Button onClick={handleCreateWorkflow}>新建工作流</Button>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {workflow.description || '无描述'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      节点数: {workflow.nodes.length} | 连接数: {workflow.edges.length}
                    </p>
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
        </div>
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
} 