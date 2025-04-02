'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  ArrowUpDown
} from 'lucide-react';
import { workflowService, Workflow } from '@/api/WorkflowService';
import { format } from 'date-fns';

export default function WorkflowListPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Workflow>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = () => {
    const allWorkflows = workflowService.getWorkflows();
    setWorkflows(allWorkflows);
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) {
      alert('请输入工作流名称');
      return;
    }

    const newWorkflow = workflowService.createWorkflow({
      name: newWorkflowName,
      description: newWorkflowDescription,
      nodes: [],
      edges: []
    });

    setWorkflows([...workflows, newWorkflow]);
    setShowNewDialog(false);
    setNewWorkflowName('');
    setNewWorkflowDescription('');

    // 可以选择直接导航到新创建的工作流
    // router.push(`/workflow?id=${newWorkflow.id}`);
  };

  const handleDeleteWorkflow = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('确定要删除此工作流吗？此操作无法撤销。')) {
      workflowService.deleteWorkflow(id);
      loadWorkflows();
    }
  };

  const handleDuplicateWorkflow = (workflow: Workflow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const duplicate = workflowService.createWorkflow({
      name: `${workflow.name} (副本)`,
      description: workflow.description,
      nodes: workflow.nodes,
      edges: workflow.edges
    });
    
    loadWorkflows();
  };

  const toggleSort = (field: keyof Workflow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFilteredWorkflows = workflows
    .filter(workflow => 
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.description && workflow.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      return 0;
    });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">工作流管理</h1>
          <p className="text-muted-foreground">创建、编辑和管理你的工作流</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建工作流
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新工作流</DialogTitle>
              <DialogDescription>
                创建一个新的工作流。你可以在创建后添加节点和连接。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">名称</label>
                <Input
                  id="name"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="输入工作流名称"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">描述</label>
                <Input
                  id="description"
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  placeholder="输入工作流描述（可选）"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateWorkflow}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>搜索工作流</CardTitle>
          <CardDescription>
            搜索你的工作流名称或描述
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索工作流..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>工作流列表</CardTitle>
          <CardDescription>
            共 {workflows.length} 个工作流，显示 {sortedAndFilteredWorkflows.length} 个匹配结果
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">
                    名称
                    {sortField === 'name' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>描述</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort('updatedAt')}
                >
                  <div className="flex items-center">
                    更新时间
                    {sortField === 'updatedAt' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredWorkflows.length > 0 ? (
                sortedAndFilteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/workflow?id=${workflow.id}`}
                        className="hover:underline text-blue-600"
                      >
                        {workflow.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {workflow.description || '-'}
                    </TableCell>
                    <TableCell>
                      {format(workflow.updatedAt, 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/workflow?id=${workflow.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={(e) => handleDuplicateWorkflow(workflow, e)}>
                            <Copy className="h-4 w-4 mr-2" />
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    {workflows.length === 0 ? '暂无工作流，点击"新建工作流"开始创建' : '未找到匹配的工作流'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sortedAndFilteredWorkflows.length > 0 ? `显示 ${sortedAndFilteredWorkflows.length} 个工作流` : ''}
          </p>
          {workflows.length > 0 && searchQuery && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              清除搜索
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 