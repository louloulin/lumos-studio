import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkflowEditor from '@/components/workflow/WorkflowEditor';
import { Workflow, workflowService } from '@/api/WorkflowService';
import { ReactFlowProvider } from 'reactflow';
import { Loader2 } from 'lucide-react';

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