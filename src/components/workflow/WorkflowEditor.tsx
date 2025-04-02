import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  BackgroundVariant,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  Workflow,
  WorkflowNode as WorkflowNodeType,
  WorkflowEdge,
  WorkflowNodeType as NodeType,
  WorkflowService,
  createWorkflowNode,
} from '@/api/WorkflowService';

import { WorkflowNodePanel } from './WorkflowNodePanel';
import {
  CircleNode,
  DefaultNode,
  AgentNode,
  ToolNode,
  ConditionNode,
  LoopNode,
  InputNode,
  OutputNode,
  AINode,
  StringNode,
  FunctionNode,
  TriggerNode,
  VariableNode,
  AINodeEditor,
  StringNodeEditor,
  FunctionNodeEditor,
  VariableNodeEditor,
  TriggerNodeEditor,
  HttpRequestNodeEditor,
  HttpRequestNode,
  ConditionNodeEditor,
} from './nodes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Plus, Save, Play, Settings } from 'lucide-react';

// 注册节点类型
const nodeTypes = {
  circle: CircleNode,
  default: DefaultNode,
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
  loop: LoopNode,
  input: InputNode,
  output: OutputNode,
  ai: AINode,
  string: StringNode,
  function: FunctionNode,
  trigger: TriggerNode,
  variable: VariableNode,
  http_request: HttpRequestNode
};

interface WorkflowEditorProps {
  workflow: Workflow;
  onSave: (workflow: Workflow) => void;
  onBack: () => void;
}

export default function WorkflowEditorProvider({ workflow, onSave, onBack }: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditor workflow={workflow} onSave={onSave} onBack={onBack} />
    </ReactFlowProvider>
  );
}

function WorkflowEditor({ workflow, onSave, onBack }: WorkflowEditorProps) {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || '新工作流');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  
  // Node editor states
  const [aiNodeEditorOpen, setAiNodeEditorOpen] = useState(false);
  const [stringNodeEditorOpen, setStringNodeEditorOpen] = useState(false);
  const [functionNodeEditorOpen, setFunctionNodeEditorOpen] = useState(false);
  const [variableNodeEditorOpen, setVariableNodeEditorOpen] = useState(false);
  const [triggerNodeEditorOpen, setTriggerNodeEditorOpen] = useState(false);
  const [httpRequestNodeEditorOpen, setHttpRequestNodeEditorOpen] = useState(false);
  const [conditionNodeEditorOpen, setConditionNodeEditorOpen] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const workflowService = new WorkflowService();

  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  useEffect(() => {
    if (workflow) {
      // 将工作流数据转换为ReactFlow节点和边
      const flowNodes = workflow.nodes.map((node) => {
        let nodeType = 'default';
        
        // 根据节点类型选择不同的节点视图
        switch (node.type) {
          case NodeType.START:
          case NodeType.END:
            nodeType = 'circle';
            break;
          case NodeType.AGENT:
            nodeType = 'agent';
            break;
          case NodeType.TOOL:
            nodeType = 'tool';
            break;
          case NodeType.CONDITION:
            nodeType = 'condition';
            break;
          case NodeType.LOOP:
            nodeType = 'loop';
            break;
          case NodeType.INPUT:
            nodeType = 'input';
            break;
          case NodeType.OUTPUT:
            nodeType = 'output';
            break;
          default:
            if (node.type === 'ai') {
              nodeType = 'ai';
            } else if (node.type === 'string') {
              nodeType = 'string';
            } else if (node.type === 'function') {
              nodeType = 'function';
            } else if (node.type === 'trigger') {
              nodeType = 'trigger';
            } else if (node.type === 'variable') {
              nodeType = 'variable';
            }
            break;
        }

        return {
          id: node.id,
          type: nodeType,
          position: node.position || { x: 0, y: 0 },
          data: { ...node, onNodeClick: handleNodeClick },
        };
      });

      const flowEdges = workflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow,
        },
        data: { ...edge },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } else {
      // 如果没有工作流数据，初始化一个空的工作流
      setNodes([]);
      setEdges([]);
    }
  }, [workflow]);

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      
      // Open the appropriate editor based on node type
      if (node.type === 'ai') {
        setAiNodeEditorOpen(true);
      } else if (node.type === 'string') {
        setStringNodeEditorOpen(true);
      } else if (node.type === 'function') {
        setFunctionNodeEditorOpen(true);
      } else if (node.type === 'variable') {
        setVariableNodeEditorOpen(true);
      } else if (node.type === 'trigger') {
        setTriggerNodeEditorOpen(true);
      } else if (node.type === 'http_request') {
        setHttpRequestNodeEditorOpen(true);
      } else if (node.type === 'condition') {
        setConditionNodeEditorOpen(true);
      }
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      // 创建一个新的边
      const newEdge: Edge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        source: params.source, // 确保source不为null
        target: params.target, // 确保target不为null
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.Arrow,
        },
        data: {
          id: `e${params.source}-${params.target}`,
          source: params.source,
          target: params.target,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleAddNode = (type: string) => {
    if (!reactFlowInstance) return;

    // 获取视图的中心位置
    const viewport = reactFlowInstance.getViewport();
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

    // 为每种节点类型选择正确的类型值
    let nodeTypeValue: NodeType | string;
    
    // 将字符串类型映射到枚举（如果适用）
    if (type === NodeType.START || 
        type === NodeType.END || 
        type === NodeType.AGENT || 
        type === NodeType.TOOL || 
        type === NodeType.CONDITION || 
        type === NodeType.LOOP || 
        type === NodeType.INPUT || 
        type === NodeType.OUTPUT) {
      nodeTypeValue = type;
    } else {
      // 对于自定义节点类型，保持字符串值
      nodeTypeValue = type;
    }

    // 创建新的工作流节点
    const newWorkflowNode = createWorkflowNode(
      nodeTypeValue, 
      `新${type}节点`, 
      { x: centerX, y: centerY }
    );

    // 为不同节点类型添加特定的属性
    if (type === 'ai') {
      newWorkflowNode.aiConfig = {
        model: 'gpt-3.5-turbo',
        prompt: '',
        temperature: 0.7,
        maxTokens: 1000
      };
    } else if (type === 'string') {
      newWorkflowNode.stringValue = '';
    } else if (type === 'function') {
      newWorkflowNode.functionConfig = {
        code: '',
        inputParams: [],
        outputParams: []
      };
    } else if (type === 'variable') {
      newWorkflowNode.variableConfig = {
        key: '',
        type: 'STRING',
        defaultValue: ''
      };
    } else if (type === 'trigger') {
      newWorkflowNode.triggerConfig = {
        type: 'SCHEDULED',
        config: {
          schedule: '0 0 * * *'
        }
      };
    } else if (type === 'http_request') {
      newWorkflowNode.httpConfig = {
        url: '',
        method: 'GET',
        headers: {},
        timeout: 30000
      };
    } else if (type === 'condition') {
      newWorkflowNode.conditionConfig = {
        type: 'simple',
        leftOperand: 'context.variables.value',
        operator: 'equals',
        rightOperand: 'true'
      };
      newWorkflowNode.functionConfig = {
        code: 'function evaluateCondition(data, context) {\n  return context.variables.value === true;\n}',
        inputParams: [],
        outputParams: [{ name: 'result', type: 'boolean' }]
      };
    }

    // 为ReactFlow创建一个节点
    const newNode: Node = {
      id: newWorkflowNode.id,
      type: type === NodeType.START || type === NodeType.END 
        ? 'circle' 
        : type === NodeType.AGENT 
          ? 'agent' 
          : type === NodeType.TOOL 
            ? 'tool' 
            : type === NodeType.CONDITION 
              ? 'condition' 
              : type === NodeType.LOOP 
                ? 'loop' 
                : type === NodeType.INPUT 
                  ? 'input' 
                  : type === NodeType.OUTPUT 
                    ? 'output' 
                    : type,
      position: newWorkflowNode.position || { x: centerX, y: centerY },
      data: { ...newWorkflowNode, onNodeClick: handleNodeClick },
    };

    setNodes((nodes) => [...nodes, newNode]);
    
    // 对于特定类型的节点，自动打开编辑器
    if (type === 'ai' || type === 'string' || type === 'function' || 
        type === 'variable' || type === 'trigger' || type === 'http_request') {
      setSelectedNode(newNode);
      
      if (type === 'ai') {
        setAiNodeEditorOpen(true);
      } else if (type === 'string') {
        setStringNodeEditorOpen(true);
      } else if (type === 'function') {
        setFunctionNodeEditorOpen(true);
      } else if (type === 'variable') {
        setVariableNodeEditorOpen(true);
      } else if (type === 'trigger') {
        setTriggerNodeEditorOpen(true);
      } else if (type === 'http_request') {
        setHttpRequestNodeEditorOpen(true);
      }
    }
  };

  // 添加节点变更监听
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    setHasChanges(true);
  }, [onNodesChange]);

  // 添加边变更监听
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    setHasChanges(true);
  }, [onEdgesChange]);

  // 处理返回操作
  const handleBack = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      onBack();
    }
  };

  // 保存工作流并返回
  const handleSaveAndBack = () => {
    handleSaveWorkflow();
    onBack();
  };

  // 处理保存操作（更新）
  const handleSaveWorkflow = () => {
    // 将ReactFlow数据转换回工作流数据结构
    const workflowNodes = nodes.map((node) => ({
      id: node.id,
      type: node.data.type,
      name: node.data.name,
      description: node.data.description,
      position: node.position,
      aiConfig: node.data.aiConfig,
      stringValue: node.data.stringValue,
      functionConfig: node.data.functionConfig,
      variableConfig: node.data.variableConfig,
      triggerConfig: node.data.triggerConfig,
      httpConfig: node.data.httpConfig
    }));

    const workflowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    const updatedWorkflow = {
      ...workflow,
      name: workflowName,
      description: workflowDescription,
      nodes: workflowNodes,
      edges: workflowEdges,
    };

    onSave(updatedWorkflow);
    setHasChanges(false); // 重置更改状态
    toast({
      title: '保存成功',
      description: '工作流已保存',
    });
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    try {
      // 执行工作流逻辑（未实现）
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: '执行完成',
        description: '工作流已执行完成',
      });
    } catch (error) {
      toast({
        title: '执行失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // 保存编辑器中的节点数据
  const saveNodeData = (nodeData: any) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          // 更新节点数据
          return {
            ...node,
            data: { ...node.data, ...nodeData, onNodeClick: handleNodeClick },
          };
        }
        return node;
      })
    );
  };

  return (
    <div className="flex h-full">
      <WorkflowNodePanel onAddNode={handleAddNode} />

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <Panel position="top-left" className="space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBack}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-4 w-4 mr-1"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              返回
            </Button>
          </Panel>
          <Panel position="top-right" className="space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              设置
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveWorkflow}
              disabled={isExecuting}
            >
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExecuteWorkflow}
              disabled={isExecuting}
            >
              <Play className="h-4 w-4 mr-1" />
              {isExecuting ? '执行中...' : '执行'}
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* 未保存更改对话框 */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>未保存的更改</AlertDialogTitle>
            <AlertDialogDescription>
              你有未保存的更改。离开前是否要保存它们？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              取消
            </AlertDialogCancel>
            <Button variant="outline" onClick={() => {
              setShowUnsavedDialog(false);
              onBack();
            }}>
              不保存
            </Button>
            <AlertDialogAction onClick={handleSaveAndBack}>
              保存并返回
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 工作流设置对话框 */}
      <AlertDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>工作流设置</AlertDialogTitle>
            <AlertDialogDescription>
              配置工作流的基本信息
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">名称</label>
              <Input
                id="name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">描述</label>
              <Input
                id="description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowSettingsDialog(false)}>保存</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Node Editors */}
      {selectedNode && selectedNode.type === 'ai' && (
        <AINodeEditor
          open={aiNodeEditorOpen}
          onOpenChange={setAiNodeEditorOpen}
          initialData={selectedNode.data}
          onSave={saveNodeData}
        />
      )}
      
      {selectedNode && selectedNode.type === 'string' && (
        <StringNodeEditor
          open={stringNodeEditorOpen}
          onOpenChange={setStringNodeEditorOpen}
          initialData={selectedNode.data}
          onSave={saveNodeData}
        />
      )}
      
      {selectedNode && selectedNode.type === 'function' && (
        <FunctionNodeEditor
          open={functionNodeEditorOpen}
          onOpenChange={setFunctionNodeEditorOpen}
          initialData={selectedNode.data}
          onSave={saveNodeData}
        />
      )}
      
      {selectedNode && selectedNode.type === 'variable' && (
        <VariableNodeEditor
          open={variableNodeEditorOpen}
          onOpenChange={setVariableNodeEditorOpen}
          initialData={selectedNode.data}
          onSave={saveNodeData}
        />
      )}
      
      {selectedNode && selectedNode.type === 'trigger' && (
        <TriggerNodeEditor
          open={triggerNodeEditorOpen}
          onOpenChange={setTriggerNodeEditorOpen}
          initialData={selectedNode.data}
          onSave={saveNodeData}
        />
      )}
      
      {selectedNode && selectedNode.type === 'http_request' && (
        <HttpRequestNodeEditor
          open={httpRequestNodeEditorOpen}
          onOpenChange={setHttpRequestNodeEditorOpen}
          initialData={selectedNode.data}
          onSave={saveNodeData}
        />
      )}
      
      {selectedNode && selectedNode.type === 'condition' && (
        <ConditionNodeEditor
          open={conditionNodeEditorOpen}
          onOpenChange={setConditionNodeEditorOpen}
          initialData={selectedNode.data}
          onSave={saveNodeData}
        />
      )}
    </div>
  );
} 