import React, { useState, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  Connection,
  NodeMouseHandler,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PlusCircle, Save, Download, Upload, Trash2, Settings2 } from 'lucide-react';

// Node types
const nodeTypes = {
  start: { label: '开始', color: '#22c55e' },
  tool: { label: '工具调用', color: '#3b82f6' },
  condition: { label: '条件判断', color: '#f59e0b' },
  llm: { label: 'LLM 调用', color: '#8b5cf6' },
  output: { label: '输出', color: '#ef4444' },
  end: { label: '结束', color: '#64748b' },
};

interface NodeData {
  label: string;
  description: string;
  color: string;
}

// Custom node component
const CustomNode = ({ data, id, selected }: { data: NodeData; id: string; selected: boolean }) => {
  return (
    <div
      className={`p-3 rounded-lg border-2 ${
        selected ? 'border-primary' : 'border-border'
      }`}
      style={{ backgroundColor: data.color, minWidth: '150px' }}
    >
      <div className="text-white font-medium">{data.label}</div>
      <div className="text-white/80 text-sm mt-1">{data.description}</div>
    </div>
  );
};

// Initial nodes and edges
const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'input',
    data: { 
      label: '开始', 
      description: '工作流开始', 
      color: nodeTypes.start.color 
    },
    position: { x: 250, y: 5 },
  },
  {
    id: '2',
    data: { 
      label: 'LLM 调用', 
      description: '处理用户输入', 
      color: nodeTypes.llm.color 
    },
    position: { x: 250, y: 100 },
  },
  {
    id: '3',
    data: { 
      label: '条件判断', 
      description: '需要工具？', 
      color: nodeTypes.condition.color 
    },
    position: { x: 250, y: 200 },
  },
  {
    id: '4',
    data: { 
      label: '工具调用', 
      description: '搜索信息', 
      color: nodeTypes.tool.color 
    },
    position: { x: 100, y: 300 },
  },
  {
    id: '5',
    data: { 
      label: 'LLM 调用', 
      description: '生成回复', 
      color: nodeTypes.llm.color 
    },
    position: { x: 400, y: 300 },
  },
  {
    id: '6',
    type: 'output',
    data: { 
      label: '结束', 
      description: '工作流结束', 
      color: nodeTypes.end.color 
    },
    position: { x: 250, y: 400 },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    label: '是',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    label: '否',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e5-6',
    source: '5',
    target: '6',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];

interface WorkflowNodeData {
  id: string;
  type: string;
  instructions?: string;
  parameters?: Record<string, any>;
}

interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNodeData[];
  edges: {
    source: string;
    target: string;
    condition?: string;
  }[];
}

// Main component
const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [workflowName, setWorkflowName] = useState<string>('My Workflow');
  const [workflowDescription, setWorkflowDescription] = useState<string>('A custom workflow created with the visual builder');
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState<boolean>(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [exportedCode, setExportedCode] = useState<string>('');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Handle connections
  const onConnect = (params: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        },
        eds
      )
    );
  };

  // Node selection
  const onNodeClick: NodeMouseHandler = (_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
    setIsNodeDialogOpen(true);
  };

  // Update node
  const updateSelectedNode = (data: Partial<NodeData>) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
        }
        return node;
      })
    );
    setIsNodeDialogOpen(false);
  };

  // Add new node
  const addNode = (type: string) => {
    const newId = (nodes.length + 1).toString();
    const nodeType = nodeTypes[type as keyof typeof nodeTypes];
    const newNode: Node<NodeData> = {
      id: newId,
      data: {
        label: nodeType.label,
        description: '',
        color: nodeType.color,
      },
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      },
    };

    if (type === 'start') {
      newNode.type = 'input';
    } else if (type === 'end') {
      newNode.type = 'output';
    }

    setNodes((nds) => [...nds, newNode]);
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setIsNodeDialogOpen(false);
    setSelectedNode(null);
  };

  // Export workflow
  const exportWorkflow = () => {
    const workflow: WorkflowData = {
      id: Date.now().toString(),
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.label.toLowerCase().replace(' ', '_'),
        instructions: node.data.description,
        parameters: {},
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        condition: edge.label as string | undefined,
      })),
    };

    const code = `
import { Step, Workflow } from '@mastra/core/workflows';

const ${workflowName.replace(/\s+/g, '')} = new Workflow({
  name: '${workflowName.replace(/\s+/g, '-').toLowerCase()}',
  description: '${workflowDescription}',
});

// Define steps
${nodes
  .map(
    (node) => `const step${node.id} = new Step({
  id: '${node.id}',
  name: '${node.data.label}',
  description: '${node.data.description || ''}',
  run: async (context, { tools }) => {
    // Implement step logic here
    ${
      node.data.label === 'LLM 调用'
        ? `const result = await context.llm.generate({
      messages: [
        { role: 'system', content: '${node.data.description || ''}' },
        { role: 'user', content: context.input || '' }
      ]
    });
    return { output: result };`
        : node.data.label === '工具调用'
        ? `// Example tool call
    const result = await tools.webSearch.search('${node.data.description || 'example search'}');
    return { output: result };`
        : node.data.label === '条件判断'
        ? `// Example condition
    return { condition: Math.random() > 0.5 ? 'yes' : 'no' };`
        : `// Custom step logic
    return { output: 'Completed step ${node.id}' };`
    }
  }
});`
  )
  .join('\n\n')}

// Add steps and connections
${nodes.map((node) => `${workflowName.replace(/\s+/g, '')}.addStep(step${node.id});`).join('\n')}

${edges
  .map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return '';

    if (edge.label) {
      return `${workflowName.replace(/\s+/g, '')}.addCondition({
  if: step${edge.source},
  condition: '${edge.label}',
  then: step${edge.target}
});`;
    } else {
      return `${workflowName.replace(/\s+/g, '')}.addEdge({
  from: step${edge.source},
  to: step${edge.target}
});`;
    }
  })
  .filter(Boolean)
  .join('\n')}

// Commit the workflow (finalize)
${workflowName.replace(/\s+/g, '')}.commit();

export { ${workflowName.replace(/\s+/g, '')} };
`;

    setExportedCode(code);
    setIsExportDialogOpen(true);
  };

  // Load workflow from JSON
  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string) as WorkflowData;
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description);

        // Create nodes
        const newNodes = workflow.nodes.map((nodeData) => {
          const nodeType = Object.entries(nodeTypes).find(
            ([key]) => key === nodeData.type
          );
          
          return {
            id: nodeData.id,
            type: nodeData.type === 'start' ? 'input' : nodeData.type === 'end' ? 'output' : undefined,
            data: {
              label: nodeType ? nodeType[1].label : nodeData.type,
              description: nodeData.instructions || '',
              color: nodeType ? nodeType[1].color : '#888888',
            },
            position: {
              x: Math.random() * 300 + 50,
              y: Math.random() * 300 + 50,
            },
          };
        });

        // Create edges
        const newEdges = workflow.edges.map((edgeData, index) => ({
          id: `e${edgeData.source}-${edgeData.target}`,
          source: edgeData.source,
          target: edgeData.target,
          label: edgeData.condition,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }));

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error('Failed to import workflow:', error);
        alert('Invalid workflow file format');
      }
    };
    reader.readAsText(file);
  };

  // Save workflow as JSON
  const saveWorkflow = () => {
    const workflow: WorkflowData = {
      id: Date.now().toString(),
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.label.toLowerCase().replace(' ', '_'),
        instructions: node.data.description,
        parameters: {},
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        condition: edge.label as string | undefined,
      })),
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div>
            <Label htmlFor="workflow-name">工作流名称</Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div>
            <Label htmlFor="workflow-desc">描述</Label>
            <Input
              id="workflow-desc"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="w-96"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="outline" className="gap-1">
              <Upload className="h-4 w-4" /> 导入
              <input
                type="file"
                accept=".json"
                onChange={importWorkflow}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
          </div>
          <Button variant="outline" onClick={saveWorkflow} className="gap-1">
            <Download className="h-4 w-4" /> 保存
          </Button>
          <Button onClick={exportWorkflow} className="gap-1">
            <Save className="h-4 w-4" /> 导出代码
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-64 border-r p-4">
          <div className="font-medium mb-3">添加节点</div>
          <div className="flex flex-col gap-2">
            {Object.entries(nodeTypes).map(([key, value]) => (
              <Button
                key={key}
                variant="outline"
                className="justify-start"
                style={{ backgroundColor: value.color + '20' }}
                onClick={() => addNode(key)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: value.color }}
                ></div>
                {value.label}
              </Button>
            ))}
          </div>
          <div className="mt-8">
            <div className="font-medium mb-3">提示</div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• 点击节点编辑详情</li>
              <li>• 拖动连接节点</li>
              <li>• 使用鼠标滚轮缩放</li>
              <li>• 导出代码后可在项目中使用</li>
            </ul>
          </div>
        </div>

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={{ custom: CustomNode }}
              defaultEdgeOptions={{
                animated: true,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              }}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* Node Edit Dialog */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑节点</DialogTitle>
            <DialogDescription>
              配置节点属性和行为
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="node-name">节点名称</Label>
                  <Input
                    id="node-name"
                    value={selectedNode.data.label}
                    onChange={(e) =>
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, label: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="node-desc">描述/指令</Label>
                  <Textarea
                    id="node-desc"
                    value={selectedNode.data.description}
                    onChange={(e) =>
                      setSelectedNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, description: e.target.value },
                      })
                    }
                    rows={4}
                  />
                </div>
                {selectedNode.data.label === 'LLM 调用' && (
                  <div>
                    <Label htmlFor="node-model">模型</Label>
                    <Select defaultValue="gpt-4">
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedNode}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" /> 删除节点
            </Button>
            <div>
              <Button
                variant="outline"
                onClick={() => setIsNodeDialogOpen(false)}
                className="mr-2"
              >
                取消
              </Button>
              <Button
                onClick={() =>
                  updateSelectedNode({
                    label: selectedNode?.data.label,
                    description: selectedNode?.data.description,
                  })
                }
              >
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Code Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>导出工作流代码</DialogTitle>
            <DialogDescription>
              复制下面的代码到您的项目中使用
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-sm">{exportedCode}</pre>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(exportedCode);
              }}
            >
              复制代码
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowBuilder; 