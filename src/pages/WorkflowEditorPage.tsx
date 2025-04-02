import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkflowEditor from '@/components/workflow/WorkflowEditor';
import { Workflow, workflowService } from '@/api/WorkflowService';
import { ReactFlowProvider } from 'reactflow';
import { Loader2, Download, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

interface WorkflowEditorPageProps {
  id?: string | null;
  onBack?: () => void;
}

export default function WorkflowEditorPage({ id: propId, onBack: propOnBack }: WorkflowEditorPageProps) {
  // 支持通过props或路由参数获取id
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = propId || params.id;
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // 如果是新建工作流
    if (!id || id === 'new') {
      const newWorkflow = workflowService.createWorkflow({
        name: '新工作流',
        description: '',
        nodes: [],
        edges: []
      });
      setWorkflow(newWorkflow);
      setLoading(false);
      return;
    }
    
    // 加载现有工作流
    const existingWorkflow = workflowService.getWorkflow(id);
    if (existingWorkflow) {
      setWorkflow(existingWorkflow);
    } else {
      // 如果工作流不存在，创建新的
      const newWorkflow = workflowService.createWorkflow({
        name: '新工作流',
        description: '',
        nodes: [],
        edges: []
      });
      setWorkflow(newWorkflow);
    }
    
    setLoading(false);
  }, [id]);

  // 保存工作流
  const handleSaveWorkflow = (updatedWorkflow: Workflow) => {
    workflowService.updateWorkflow(updatedWorkflow);
    setWorkflow(updatedWorkflow);
    toast({
      title: "工作流已保存",
      description: `${updatedWorkflow.name} 已成功保存`,
    });
  };

  // 导出工作流为JSON
  const handleExportWorkflowAsJson = () => {
    if (!workflow) return;
    
    const jsonData = workflowService.exportWorkflow(workflow.id);
    if (!jsonData) return;
    
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '_')}_workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "工作流已导出",
      description: "工作流已导出为JSON格式文件",
    });
  };

  // 返回工作流列表
  const handleBack = () => {
    if (propOnBack) {
      // 如果提供了回调函数，使用回调函数
      propOnBack();
    } else {
      // 否则使用路由导航
      navigate('/workflow');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileJson className="h-4 w-4 mr-1" />
              导出
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportWorkflowAsJson}>
              <Download className="h-4 w-4 mr-2" />
              导出为JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <ReactFlowProvider>
        {workflow && (
          <WorkflowEditor 
            workflow={workflow} 
            onSave={handleSaveWorkflow} 
            onBack={handleBack} 
          />
        )}
      </ReactFlowProvider>
    </div>
  );
} 