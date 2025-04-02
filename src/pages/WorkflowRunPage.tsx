import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Play, Pause, RotateCcw, ArrowLeft, Info, AlertTriangle, AlertCircle, 
  CheckCircle, Clock, ArrowRight, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import ReactFlow, { Node, Edge, Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { workflowService, Workflow, WorkflowNodeType } from '@/api/WorkflowService';
import { 
  WorkflowExecutor, 
  WorkflowExecutionStatus, 
  NodeExecutionStatus,
  NodeExecutionResult, 
  WorkflowExecutionState 
} from '@/api/WorkflowExecutor';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { NODE_TYPES } from '@/components/workflow/nodes';
import { getNodeTypeLabel, workflowToReactFlowNodes, workflowToReactFlowEdges } from '@/components/workflow/utils/workflowUtils';

// 工作流节点类型
const nodeTypes = NODE_TYPES;

// 状态类型颜色映射
const workflowStatusColors = {
  [WorkflowExecutionStatus.IDLE]: 'bg-gray-400',
  [WorkflowExecutionStatus.RUNNING]: 'bg-blue-500',
  [WorkflowExecutionStatus.COMPLETED]: 'bg-green-500',
  [WorkflowExecutionStatus.FAILED]: 'bg-red-500',
  [WorkflowExecutionStatus.PAUSED]: 'bg-amber-500',
};

const nodeStatusColors = {
  [NodeExecutionStatus.PENDING]: 'bg-gray-400',
  [NodeExecutionStatus.RUNNING]: 'bg-blue-500',
  [NodeExecutionStatus.COMPLETED]: 'bg-green-500',
  [NodeExecutionStatus.FAILED]: 'bg-red-500',
  [NodeExecutionStatus.SKIPPED]: 'bg-purple-500'
};

// 状态标签映射
const workflowStatusLabels = {
  [WorkflowExecutionStatus.IDLE]: '空闲',
  [WorkflowExecutionStatus.RUNNING]: '运行中',
  [WorkflowExecutionStatus.COMPLETED]: '已完成',
  [WorkflowExecutionStatus.FAILED]: '失败',
  [WorkflowExecutionStatus.PAUSED]: '已暂停',
};

const nodeStatusLabels = {
  [NodeExecutionStatus.PENDING]: '等待中',
  [NodeExecutionStatus.RUNNING]: '运行中',
  [NodeExecutionStatus.COMPLETED]: '已完成',
  [NodeExecutionStatus.FAILED]: '失败',
  [NodeExecutionStatus.SKIPPED]: '已跳过'
};

// 状态图标映射
const workflowStatusIcons = {
  [WorkflowExecutionStatus.IDLE]: <Clock className="h-4 w-4" />,
  [WorkflowExecutionStatus.RUNNING]: <Play className="h-4 w-4" />,
  [WorkflowExecutionStatus.COMPLETED]: <CheckCircle className="h-4 w-4" />,
  [WorkflowExecutionStatus.FAILED]: <AlertCircle className="h-4 w-4" />,
  [WorkflowExecutionStatus.PAUSED]: <Pause className="h-4 w-4" />,
};

const nodeStatusIcons = {
  [NodeExecutionStatus.PENDING]: <Clock className="h-4 w-4" />,
  [NodeExecutionStatus.RUNNING]: <Play className="h-4 w-4" />,
  [NodeExecutionStatus.COMPLETED]: <CheckCircle className="h-4 w-4" />,
  [NodeExecutionStatus.FAILED]: <AlertCircle className="h-4 w-4" />,
  [NodeExecutionStatus.SKIPPED]: <ArrowRight className="h-4 w-4" />
};

interface WorkflowRunPageProps {
  id?: string | null;
  onBack?: () => void;
}

export default function WorkflowRunPage({ id: propId, onBack: propOnBack }: WorkflowRunPageProps) {
  // 支持通过props或路由参数获取id
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = propId || params.id;
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executionState, setExecutionState] = useState<WorkflowExecutionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodeResult, setSelectedNodeResult] = useState<NodeExecutionResult | null>(null);
  const [executor, setExecutor] = useState<WorkflowExecutor | null>(null);
  const [inputParams, setInputParams] = useState<Record<string, any>>({});
  const [showInputDialog, setShowInputDialog] = useState(false);
  
  // 加载工作流
  useEffect(() => {
    if (!id) return;
    
    const workflowData = workflowService.getWorkflow(id);
    if (!workflowData) {
      setError('找不到工作流');
      return;
    }
    
    setWorkflow(workflowData);
    
    // 转换节点和边为ReactFlow格式
    const flowNodes = workflowToReactFlowNodes(workflowData.nodes);
    const flowEdges = workflowToReactFlowEdges(workflowData.edges);
    
    setNodes(flowNodes);
    setEdges(flowEdges);
    
    // 创建执行器
    const newExecutor = new WorkflowExecutor(workflowData, {
      onNodeStart: (nodeId, context) => {
        console.log(`节点开始执行: ${nodeId}`, context);
      },
      onNodeComplete: (result, context) => {
        console.log(`节点执行完成: ${result.nodeId}, 状态: ${result.status}`, context);
        // 使用函数式更新确保状态同步
        setExecutionState(newExecutor.getState());
      },
      onWorkflowComplete: (state) => {
        console.log('工作流执行完成', state);
        setExecutionState(state);
      },
      onWorkflowError: (error, state) => {
        console.error('工作流执行失败', error);
        setError(error.message);
        setExecutionState(state);
      },
      onStatusChange: (status, state) => {
        console.log(`工作流状态变更为: ${status}`, state);
        setExecutionState(state);
      }
    });
    
    setExecutor(newExecutor);
    setExecutionState(newExecutor.getState());
  }, [id]);
  
  // 当节点执行状态更新时，更新节点外观
  useEffect(() => {
    if (!executionState || !workflow) return;
    
    // 更新节点外观
    const updatedNodes = nodes.map(node => {
      const nodeResult = executionState.nodeResults[node.id];
      
      // 计算节点状态对应的样式
      let className = 'bg-background border-2 rounded-md shadow-sm ';
      
      if (!nodeResult) {
        className += 'border-muted';
      } else {
        switch (nodeResult.status) {
          case NodeExecutionStatus.PENDING:
            className += 'border-gray-400';
            break;
          case NodeExecutionStatus.RUNNING:
            className += 'border-blue-500 animate-pulse';
            break;
          case NodeExecutionStatus.COMPLETED:
            className += 'border-green-500';
            break;
          case NodeExecutionStatus.FAILED:
            className += 'border-red-500';
            break;
          case NodeExecutionStatus.SKIPPED:
            className += 'border-purple-500';
            break;
          default:
            className += 'border-muted';
        }
      }
      
      // 当前选中的节点
      if (node.id === selectedNode) {
        className += ' border-primary border-2';
      }
      
      // 当前正在执行的节点
      if (node.id === executionState.currentNodeId) {
        className += ' bg-blue-50 dark:bg-blue-950';
      }
      
      return {
        ...node,
        className
      };
    });
    
    setNodes(updatedNodes);
    
    // 如果有选中的节点，更新选中节点的结果
    if (selectedNode && executionState.nodeResults[selectedNode]) {
      setSelectedNodeResult(executionState.nodeResults[selectedNode]);
    }
  }, [executionState, selectedNode, workflow]);
  
  // 开始执行工作流
  const handleRunWorkflow = async () => {
    if (!executor) return;
    
    setError(null);
    
    try {
      // 开始执行
      executor.execute({ initial: inputParams.input || '' }).catch(err => {
        console.error('执行工作流失败:', err);
      });
      
      // 立即更新状态
      setExecutionState(executor.getState());
    } catch (err) {
      console.error('启动工作流执行失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  
  // 暂停工作流
  const handlePauseWorkflow = () => {
    if (!executor) return;
    
    executor.pause();
    setExecutionState(executor.getState());
  };
  
  // 恢复工作流
  const handleResumeWorkflow = () => {
    if (!executor) return;
    
    executor.resume();
    setExecutionState(executor.getState());
  };
  
  // 重置工作流
  const handleResetWorkflow = () => {
    if (!workflow) return;
    
    // 重新创建执行器
    const newExecutor = new WorkflowExecutor(workflow, {
      onNodeStart: (nodeId, context) => {
        console.log(`节点开始执行: ${nodeId}`, context);
      },
      onNodeComplete: (result, context) => {
        console.log(`节点执行完成: ${result.nodeId}, 状态: ${result.status}`, context);
        // 使用函数式更新确保状态同步
        setExecutionState(newExecutor.getState());
      },
      onWorkflowComplete: (state) => {
        console.log('工作流执行完成', state);
        setExecutionState(state);
      },
      onWorkflowError: (error, state) => {
        console.error('工作流执行失败', error);
        setError(error.message);
        setExecutionState(state);
      },
      onStatusChange: (status, state) => {
        console.log(`工作流状态变更为: ${status}`, state);
        setExecutionState(state);
      }
    });
    
    setExecutor(newExecutor);
    setExecutionState(newExecutor.getState());
    setError(null);
  };
  
  // 处理节点点击
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    if (executionState && executionState.nodeResults[node.id]) {
      setSelectedNodeResult(executionState.nodeResults[node.id]);
    } else {
      setSelectedNodeResult(null);
    }
  };
  
  // 处理输入参数变更
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputParams({
      ...inputParams,
      input: e.target.value
    });
  };
  
  // 渲染工作流状态标志
  const renderStatusBadge = (status: WorkflowExecutionStatus | NodeExecutionStatus) => {
    let color, icon, label;
    
    if (Object.values(WorkflowExecutionStatus).includes(status as WorkflowExecutionStatus)) {
      color = workflowStatusColors[status as WorkflowExecutionStatus];
      icon = workflowStatusIcons[status as WorkflowExecutionStatus];
      label = workflowStatusLabels[status as WorkflowExecutionStatus];
    } else {
      color = nodeStatusColors[status as NodeExecutionStatus];
      icon = nodeStatusIcons[status as NodeExecutionStatus];
      label = nodeStatusLabels[status as NodeExecutionStatus];
    }
    
    return (
      <Badge 
        className={`${color} text-white flex gap-1 items-center`}
        variant="outline"
      >
        {icon}
        {label}
      </Badge>
    );
  };
  
  // 渲染选中节点的详情
  const renderNodeDetails = () => {
    if (!selectedNode || !selectedNodeResult) return null;
    
    const node = workflow?.nodes.find(n => n.id === selectedNode);
    if (!node) return null;
    
    return (
      <div className="p-4 border rounded-md space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">{node.name || node.id}</h3>
            <p className="text-sm text-muted-foreground">{renderNodeTypeLabel(node.type)}</p>
          </div>
          {renderStatusBadge(selectedNodeResult.status)}
        </div>
        
        {selectedNodeResult.status === NodeExecutionStatus.FAILED && selectedNodeResult.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>执行错误</AlertTitle>
            <AlertDescription>{selectedNodeResult.error}</AlertDescription>
          </Alert>
        )}
        
        {selectedNodeResult.startTime && (
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">开始时间:</span> 
              <span>{format(selectedNodeResult.startTime, 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
            {selectedNodeResult.endTime && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">完成时间:</span>
                  <span>{format(selectedNodeResult.endTime, 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">执行时长:</span>
                  <span>{(selectedNodeResult.duration || 0) / 1000} 秒</span>
                </div>
              </>
            )}
          </div>
        )}
        
        {selectedNodeResult.output && (
          <div>
            <h4 className="text-sm font-medium mb-1">输出结果:</h4>
            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
              {typeof selectedNodeResult.output === 'string' 
                ? selectedNodeResult.output 
                : JSON.stringify(selectedNodeResult.output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };
  
  // 渲染节点类型标签
  const renderNodeTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      [WorkflowNodeType.START]: '开始节点',
      [WorkflowNodeType.END]: '结束节点',
      [WorkflowNodeType.AGENT]: '智能体节点',
      [WorkflowNodeType.TOOL]: '工具节点',
      [WorkflowNodeType.CONDITION]: '条件节点',
      [WorkflowNodeType.INPUT]: '输入节点',
      [WorkflowNodeType.OUTPUT]: '输出节点',
      [WorkflowNodeType.LOOP]: '循环节点'
    };
    
    return typeMap[type] || type;
  };
  
  // 渲染工作流进度
  const renderProgress = () => {
    if (!executionState || !workflow) return null;
    
    const totalNodes = workflow.nodes.length;
    const completedNodes = Object.values(executionState.nodeResults)
      .filter(result => 
        result.status === NodeExecutionStatus.COMPLETED || 
        result.status === NodeExecutionStatus.SKIPPED
      ).length;
    
    const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>执行进度</span>
          <span>{Math.round(progress)}% ({completedNodes}/{totalNodes})</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  };
  
  // 渲染输入参数对话框
  const renderInputDialog = () => {
    return (
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置工作流输入参数</DialogTitle>
            <DialogDescription>
              请输入工作流的初始参数，将作为起始节点的输入。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflowInput">输入文本</Label>
              <Textarea
                id="workflowInput"
                placeholder="请输入工作流处理的文本..."
                value={inputParams.input || ''}
                onChange={handleInputChange}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInputDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              setShowInputDialog(false);
              handleRunWorkflow();
            }}>
              开始执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
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
  
  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {workflow ? `执行工作流: ${workflow.name}` : '工作流运行'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {workflow?.description || ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {executionState && executionState.status && renderStatusBadge(executionState.status)}
          
          <div className="flex gap-2">
            {(!executionState || 
              executionState.status === WorkflowExecutionStatus.IDLE || 
              executionState.status === WorkflowExecutionStatus.FAILED || 
              executionState.status === WorkflowExecutionStatus.COMPLETED) && (
              <>
                <Button onClick={() => setShowInputDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  设置输入
                </Button>
                <Button onClick={handleRunWorkflow}>
                  <Play className="h-4 w-4 mr-2" />
                  运行
                </Button>
              </>
            )}
            
            {executionState && executionState.status === WorkflowExecutionStatus.RUNNING && (
              <Button onClick={handlePauseWorkflow} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                暂停
              </Button>
            )}
            
            {executionState && executionState.status === WorkflowExecutionStatus.PAUSED && (
              <Button onClick={handleResumeWorkflow} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                继续
              </Button>
            )}
            
            <Button 
              onClick={handleResetWorkflow}
              variant="outline"
              disabled={executionState?.status === WorkflowExecutionStatus.RUNNING}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 工作流图区域 */}
        <div className="flex-1">
          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* 工作流图 */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            className="bg-slate-50 dark:bg-slate-900"
          >
            <Controls />
            <MiniMap />
            <Background />
          </ReactFlow>
        </div>
        
        {/* 右侧信息面板 */}
        <div className="w-80 border-l overflow-y-auto flex flex-col">
          <Card className="border-0 shadow-none rounded-none flex-1">
            <CardHeader className="px-4 py-3 border-b space-y-1">
              <CardTitle className="text-base">执行信息</CardTitle>
              <CardDescription>查看执行状态和节点详情</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* 执行状态 */}
              {executionState && (
                <div className="space-y-4">
                  {renderProgress()}
                  
                  {executionState.startTime && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">开始时间:</span>
                        <span>{format(executionState.startTime, 'yyyy-MM-dd HH:mm:ss')}</span>
                      </div>
                      
                      {executionState.endTime && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">结束时间:</span>
                            <span>{format(executionState.endTime, 'yyyy-MM-dd HH:mm:ss')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">总执行时间:</span>
                            <span>{(executionState.duration || 0) / 1000} 秒</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {executionState.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>工作流错误</AlertTitle>
                      <AlertDescription>{executionState.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              {/* 选中节点的详情 */}
              <div>
                <h3 className="text-sm font-medium mb-2">节点详情</h3>
                {selectedNode ? renderNodeDetails() : (
                  <div className="text-center p-4 border rounded-md border-dashed">
                    <p className="text-sm text-muted-foreground">
                      点击工作流图中的节点查看详情
                    </p>
                  </div>
                )}
              </div>
              
              {/* 最终输出结果 */}
              {executionState?.status === WorkflowExecutionStatus.COMPLETED && (
                <div>
                  <h3 className="text-sm font-medium mb-2">最终输出结果</h3>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                    {executionState.outputs.final 
                      ? (typeof executionState.outputs.final === 'string'
                        ? executionState.outputs.final
                        : JSON.stringify(executionState.outputs.final, null, 2))
                      : '无输出结果'}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 输入参数对话框 */}
      {renderInputDialog()}
    </div>
  );
}