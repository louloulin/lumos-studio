import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  History, 
  Undo2,
  GitCompare,
  Calendar,
  MoreHorizontal,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Workflow, workflowService } from '@/api/WorkflowService';

// 定义工作流版本类型
export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  timestamp: number;
  changes: string;
  workflow: Workflow;
  author?: string;
  commitMessage?: string;
}

interface WorkflowVersionManagerProps {
  workflowId: string;
  currentWorkflow: Workflow;
  onRestore: (workflow: Workflow) => void;
}

export function WorkflowVersionManager({
  workflowId,
  currentWorkflow,
  onRestore
}: WorkflowVersionManagerProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<WorkflowVersion | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // 模拟加载版本历史
  useEffect(() => {
    if (workflowId) {
      loadVersions();
    }
  }, [workflowId]);
  
  // 加载工作流版本历史
  const loadVersions = () => {
    // 由于这是一个示例，我们将创建一些模拟版本数据
    // 实际应用中应该从API或本地存储中获取
    const mockVersions: WorkflowVersion[] = [
      {
        id: 'v1',
        workflowId,
        version: 1,
        timestamp: Date.now() - 86400000 * 5,
        changes: '初始版本',
        workflow: { ...currentWorkflow, updatedAt: Date.now() - 86400000 * 5 },
        author: '用户',
        commitMessage: '创建工作流'
      },
      {
        id: 'v2',
        workflowId,
        version: 2,
        timestamp: Date.now() - 86400000 * 3,
        changes: '添加AI节点',
        workflow: { ...currentWorkflow, updatedAt: Date.now() - 86400000 * 3 },
        author: '用户',
        commitMessage: '添加AI模型节点'
      },
      {
        id: 'v3',
        workflowId,
        version: 3,
        timestamp: Date.now() - 86400000 * 1,
        changes: '修改条件逻辑',
        workflow: { ...currentWorkflow, updatedAt: Date.now() - 86400000 * 1 },
        author: '用户',
        commitMessage: '优化条件判断逻辑'
      },
      {
        id: 'current',
        workflowId,
        version: 4,
        timestamp: Date.now(),
        changes: '当前版本',
        workflow: currentWorkflow,
        author: '用户',
        commitMessage: '当前工作区'
      }
    ];
    
    setVersions(mockVersions);
  };
  
  // 创建新版本
  const createVersion = () => {
    if (!commitMessage.trim()) {
      alert('请输入版本说明');
      return;
    }
    
    const newVersion: WorkflowVersion = {
      id: `v${versions.length + 1}`,
      workflowId,
      version: versions.length + 1,
      timestamp: Date.now(),
      changes: commitMessage,
      workflow: { ...currentWorkflow },
      author: '用户',
      commitMessage
    };
    
    setVersions([...versions, newVersion]);
    setCommitMessage('');
    
    // 模拟版本保存成功
    alert('版本保存成功');
  };
  
  // 回滚到选定版本
  const handleRestore = (version: WorkflowVersion) => {
    setConfirmAction(() => () => {
      // 执行回滚
      onRestore(version.workflow);
      setIsDialogOpen(false);
    });
    setConfirmMessage(`确定要回滚到版本 ${version.version}（${version.commitMessage}）吗？这将丢失当前未保存的更改。`);
    setIsDialogOpen(true);
  };
  
  // 比较选定版本
  const handleCompare = (version: WorkflowVersion) => {
    if (isComparing) {
      setCompareVersion(version);
    } else {
      setSelectedVersion(version);
      setIsComparing(true);
    }
  };
  
  // 取消比较
  const cancelCompare = () => {
    setIsComparing(false);
    setCompareVersion(null);
  };
  
  // 获取节点差异
  const getNodeDifferences = () => {
    if (!selectedVersion || !compareVersion) return [];
    
    const version1Nodes = selectedVersion.workflow.nodes;
    const version2Nodes = compareVersion.workflow.nodes;
    
    // 分析节点差异
    const added = version2Nodes.filter(
      node => !version1Nodes.some(n => n.id === node.id)
    );
    
    const removed = version1Nodes.filter(
      node => !version2Nodes.some(n => n.id === node.id)
    );
    
    const modified = version2Nodes.filter(node => {
      const oldNode = version1Nodes.find(n => n.id === node.id);
      return oldNode && JSON.stringify(oldNode) !== JSON.stringify(node);
    });
    
    return [
      ...added.map(node => ({ 
        node, 
        type: 'added' as const,
        description: `添加了 "${node.name}" 节点`
      })),
      ...removed.map(node => ({ 
        node, 
        type: 'removed' as const,
        description: `删除了 "${node.name}" 节点`
      })),
      ...modified.map(node => ({ 
        node, 
        type: 'modified' as const,
        description: `修改了 "${node.name}" 节点` 
      }))
    ];
  };
  
  // 获取边差异
  const getEdgeDifferences = () => {
    if (!selectedVersion || !compareVersion) return [];
    
    const version1Edges = selectedVersion.workflow.edges;
    const version2Edges = compareVersion.workflow.edges;
    
    // 分析边差异
    const added = version2Edges.filter(
      edge => !version1Edges.some(e => e.id === edge.id)
    );
    
    const removed = version1Edges.filter(
      edge => !version2Edges.some(e => e.id === edge.id)
    );
    
    const modified = version2Edges.filter(edge => {
      const oldEdge = version1Edges.find(e => e.id === edge.id);
      return oldEdge && JSON.stringify(oldEdge) !== JSON.stringify(edge);
    });
    
    return [
      ...added.map(edge => ({ 
        edge, 
        type: 'added' as const,
        description: `添加了从 "${edge.source}" 到 "${edge.target}" 的连接`
      })),
      ...removed.map(edge => ({ 
        edge, 
        type: 'removed' as const,
        description: `删除了从 "${edge.source}" 到 "${edge.target}" 的连接`
      })),
      ...modified.map(edge => ({ 
        edge, 
        type: 'modified' as const,
        description: `修改了从 "${edge.source}" 到 "${edge.target}" 的连接`
      }))
    ];
  };
  
  // 导出版本
  const exportVersion = (version: WorkflowVersion) => {
    const jsonStr = JSON.stringify(version.workflow, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${version.workflowId}_v${version.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 复制版本为新工作流
  const copyAsNewWorkflow = (version: WorkflowVersion) => {
    const workflow = { ...version.workflow } as Partial<Workflow>;
    workflow.id = undefined;
    workflow.name = `${workflow.name} (复制于 v${version.version})`;
    
    const newWorkflow = workflowService.createWorkflow(workflow as Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>);
    alert(`已创建新工作流: ${newWorkflow.name}`);
  };
  
  // 渲染版本徽章
  const renderVersionBadge = (version: WorkflowVersion) => {
    if (version.id === 'current') {
      return <Badge className="bg-green-500">当前</Badge>;
    }
    return <Badge variant="outline">v{version.version}</Badge>;
  };
  
  // 格式化时间
  const formatDateTime = (timestamp: number) => {
    return format(timestamp, 'yyyy-MM-dd HH:mm:ss');
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <History className="h-5 w-5 mr-2 text-muted-foreground" />
              版本管理
            </h3>
            <p className="text-sm text-muted-foreground">
              管理工作流的版本历史和变更
            </p>
          </div>
          <div className="flex gap-2">
            {/* 完成比较按钮 */}
            {isComparing && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={cancelCompare}
              >
                取消比较
              </Button>
            )}
            
            {/* 保存版本按钮 */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">保存当前版本</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>保存版本</DialogTitle>
                  <DialogDescription>
                    为当前工作流创建一个新版本，便于后续回溯和比较
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <label className="block text-sm font-medium mb-2">
                    版本说明
                  </label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    placeholder="描述此版本的变更内容..."
                    rows={3}
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  ></textarea>
                </div>
                <DialogFooter>
                  <Button onClick={createVersion}>创建版本</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {isComparing && compareVersion ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-semibold flex items-center">
                  <GitCompare className="h-4 w-4 mr-2" />
                  版本比较
                </h3>
                <p className="text-sm text-muted-foreground">
                  比较版本 v{selectedVersion?.version} 和 v{compareVersion.version} 之间的差异
                </p>
              </div>
            </div>
            
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">变更摘要</TabsTrigger>
                <TabsTrigger value="nodes">节点变更</TabsTrigger>
                <TabsTrigger value="edges">连接变更</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-md p-4">
                    <div className="font-medium">版本 {selectedVersion?.version}</div>
                    <div className="text-sm text-muted-foreground">{selectedVersion?.commitMessage}</div>
                    <div className="text-xs mt-2">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDateTime(selectedVersion?.timestamp || 0)}
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="font-medium">版本 {compareVersion.version}</div>
                    <div className="text-sm text-muted-foreground">{compareVersion.commitMessage}</div>
                    <div className="text-xs mt-2">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDateTime(compareVersion.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">变更概要</h4>
                  
                  <div className="space-y-2">
                    {getNodeDifferences().length > 0 || getEdgeDifferences().length > 0 ? (
                      <>
                        {getNodeDifferences().length > 0 && (
                          <div>
                            <div className="text-sm font-medium">节点变更:</div>
                            <ul className="list-disc list-inside text-sm ml-2">
                              {getNodeDifferences().slice(0, 5).map((diff, i) => (
                                <li key={i} className="text-sm">
                                  {diff.description}
                                </li>
                              ))}
                              {getNodeDifferences().length > 5 && (
                                <li className="text-sm text-muted-foreground">
                                  还有 {getNodeDifferences().length - 5} 个节点变更...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {getEdgeDifferences().length > 0 && (
                          <div>
                            <div className="text-sm font-medium">连接变更:</div>
                            <ul className="list-disc list-inside text-sm ml-2">
                              {getEdgeDifferences().slice(0, 5).map((diff, i) => (
                                <li key={i} className="text-sm">
                                  {diff.description}
                                </li>
                              ))}
                              {getEdgeDifferences().length > 5 && (
                                <li className="text-sm text-muted-foreground">
                                  还有 {getEdgeDifferences().length - 5} 个连接变更...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        这两个版本没有变化
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="nodes" className="mt-4">
                {getNodeDifferences().length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>变更类型</TableHead>
                          <TableHead>节点ID</TableHead>
                          <TableHead>节点名称</TableHead>
                          <TableHead>节点类型</TableHead>
                          <TableHead>描述</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getNodeDifferences().map((diff, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Badge
                                variant={
                                  diff.type === 'added' 
                                    ? 'default' 
                                    : diff.type === 'removed' 
                                      ? 'destructive' 
                                      : 'secondary'
                                }
                              >
                                {diff.type === 'added' ? '新增' : diff.type === 'removed' ? '删除' : '修改'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{diff.node.id}</TableCell>
                            <TableCell>{diff.node.name}</TableCell>
                            <TableCell>{diff.node.type}</TableCell>
                            <TableCell>{diff.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    没有节点变更
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="edges" className="mt-4">
                {getEdgeDifferences().length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>变更类型</TableHead>
                          <TableHead>连接ID</TableHead>
                          <TableHead>源节点</TableHead>
                          <TableHead>目标节点</TableHead>
                          <TableHead>描述</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getEdgeDifferences().map((diff, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Badge
                                variant={
                                  diff.type === 'added' 
                                    ? 'default' 
                                    : diff.type === 'removed' 
                                      ? 'destructive' 
                                      : 'secondary'
                                }
                              >
                                {diff.type === 'added' ? '新增' : diff.type === 'removed' ? '删除' : '修改'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{diff.edge.id}</TableCell>
                            <TableCell>{diff.edge.source}</TableCell>
                            <TableCell>{diff.edge.target}</TableCell>
                            <TableCell>{diff.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    没有连接变更
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>版本</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      {renderVersionBadge(version)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(version.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{version.commitMessage}</div>
                      <div className="text-xs text-muted-foreground">{version.changes}</div>
                    </TableCell>
                    <TableCell>{version.author}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {version.id !== 'current' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRestore(version)}
                            title="回滚到此版本"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCompare(version)}
                          title={isComparing ? '选择此版本比较' : '开始比较此版本'}
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportVersion(version)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              导出此版本
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyAsNewWorkflow(version)}>
                              <Copy className="h-4 w-4 mr-2" />
                              复制为新工作流
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
      </ScrollArea>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>
              {confirmMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="default"
              onClick={() => confirmAction && confirmAction()}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 