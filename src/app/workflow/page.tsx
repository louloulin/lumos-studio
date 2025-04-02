'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WorkflowEditorProvider from '@/components/workflow/WorkflowEditor';
import { workflowService, Workflow } from '@/api/WorkflowService';
import { Loader2 } from 'lucide-react';

export default function WorkflowPage() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');

  useEffect(() => {
    if (workflowId) {
      // 加载已有工作流
      const loadedWorkflow = workflowService.getWorkflow(workflowId);
      if (loadedWorkflow) {
        setWorkflow(loadedWorkflow);
      } else {
        // 工作流不存在，创建新的
        const newWorkflow = workflowService.createWorkflow({
          name: '新工作流',
          description: '',
          nodes: [],
          edges: []
        });
        setWorkflow(newWorkflow);
      }
    } else {
      // 创建新的工作流
      const newWorkflow = workflowService.createWorkflow({
        name: '新工作流',
        description: '',
        nodes: [],
        edges: []
      });
      setWorkflow(newWorkflow);
    }
    setLoading(false);
  }, [workflowId]);

  const handleSaveWorkflow = (updatedWorkflow: Workflow) => {
    // 直接使用单参数形式更新工作流
    workflowService.updateWorkflow(updatedWorkflow);
    setWorkflow(updatedWorkflow);
  };

  const handleBack = () => {
    // 使用window.location.href直接导航到主页，绕过router的潜在问题
    window.location.href = '/';
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
    <div className="h-screen w-full">
      {workflow && (
        <WorkflowEditorProvider 
          workflow={workflow} 
          onSave={handleSaveWorkflow} 
          onBack={handleBack}
        />
      )}
    </div>
  );
} 