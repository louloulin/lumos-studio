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
  Plus, Play, Pencil, MoreVertical, Trash2, Copy, Download, Upload, FileCog
} from 'lucide-react';
import { format } from 'date-fns';
import { Workflow, workflowService } from '@/api/WorkflowService';

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  
  // 加载工作流列表
  useEffect(() => {
    loadWorkflows();
  }, []);
  
  // 加载工作流
  const loadWorkflows = () => {
    const allWorkflows = workflowService.getWorkflows();
    setWorkflows(allWorkflows);
  };
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  
  // 过滤工作流
  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (workflow.description && workflow.description.toLowerCase().includes(searchText.toLowerCase()))
  );
  
  // 创建新工作流
  const handleCreateWorkflow = () => {
    navigate('/workflow/new');
  };
  
  // 编辑工作流
  const handleEditWorkflow = (id: string) => {
    navigate(`/workflow/${id}`);
  };
  
  // 运行工作流
  const handleRunWorkflow = (id: string) => {
    navigate(`/workflow/run/${id}`);
  };
  
  // 删除工作流
  const handleDeleteWorkflow = (id: string) => {
    if (confirm('确定要删除此工作流吗？此操作无法撤销。')) {
      workflowService.deleteWorkflow(id);
      loadWorkflows();
    }
  };
  
  // 复制工作流
  const handleDuplicateWorkflow = (id: string) => {
    const workflow = workflowService.getWorkflow(id);
    if (!workflow) return;
    
    const newWorkflow = {
      ...workflow,
      name: `${workflow.name} (副本)`,
      id: undefined as any,
      createdAt: undefined as any,
      updatedAt: undefined as any
    };
    
    workflowService.createWorkflow(newWorkflow);
    loadWorkflows();
  };
  
  // 导出工作流
  const handleExportWorkflow = (id: string) => {
    const jsonString = workflowService.exportWorkflow(id);
    if (!jsonString) {
      alert('导出失败');
      return;
    }
    
    // 创建下载
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const workflow = workflowService.getWorkflow(id);
    a.download = `${workflow?.name || 'workflow'}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 导入工作流
  const handleImportWorkflow = () => {
    setImportError('');
    
    try {
      const workflow = workflowService.importWorkflow(importJson);
      if (!workflow) {
        setImportError('导入失败: 无效的工作流数据');
        return;
      }
      
      setIsImportDialogOpen(false);
      setImportJson('');
      loadWorkflows();
    } catch (error) {
      setImportError(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };
  
  // 查看工作流代码
  const handleViewCode = (id: string) => {
    const workflow = workflowService.getWorkflow(id);
    if (!workflow) return;
    
    const code = workflowService.generateWorkflowCode(workflow);
    
    // 创建代码查看对话框
    const dialogContent = document.createElement('div');
    dialogContent.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; justify-content: center; align-items: center;">
        <div style="background: white; width: 80%; height: 80%; border-radius: 8px; display: flex; flex-direction: column; padding: 16px; color: black;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3>${workflow.name} 代码</h3>
            <button style="border: none; background: none; cursor: pointer; font-size: 20px;" onclick="this.parentNode.parentNode.parentNode.remove()">✕</button>
          </div>
          <pre style="flex: 1; overflow: auto; background: #f5f5f5; padding: 16px; border-radius: 4px; font-family: monospace;">${code}</pre>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialogContent);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
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
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            导入工作流
          </Button>
        </div>
      </div>
      
      <div className="flex items-center">
        <Input 
          placeholder="搜索工作流..." 
          className="max-w-sm"
          value={searchText}
          onChange={handleSearch}
        />
      </div>
      
      {filteredWorkflows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-muted-foreground">
                {searchText ? '没有找到匹配的工作流' : '没有工作流'}
              </div>
              <Button onClick={handleCreateWorkflow} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                创建第一个工作流
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>工作流名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflows.map(workflow => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell>{workflow.description || '-'}</TableCell>
                  <TableCell>{format(workflow.createdAt, 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell>{format(workflow.updatedAt, 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRunWorkflow(workflow.id)}
                        title="运行工作流"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditWorkflow(workflow.id)}
                        title="编辑工作流"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>工作流操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportWorkflow(workflow.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            导出
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewCode(workflow.id)}>
                            <FileCog className="w-4 h-4 mr-2" />
                            查看代码
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* 导入工作流对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入工作流</DialogTitle>
            <DialogDescription>
              粘贴工作流JSON数据以导入工作流
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <textarea
              className="w-full h-60 p-2 border rounded-md resize-none font-mono text-sm"
              placeholder="粘贴工作流JSON..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
            {importError && (
              <div className="text-destructive text-sm">{importError}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImportWorkflow}>
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 