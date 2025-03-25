import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  Panel,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, ZoomIn, ZoomOut, Undo, Redo, Plus } from 'lucide-react';
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowNodeType, workflowService } from '@/api/WorkflowService';
import { useNavigate, useParams } from 'react-router-dom';
import AgentNode from './nodes/AgentNode';
import ToolNode from './nodes/ToolNode';
import ConditionNode from './nodes/ConditionNode';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import WorkflowNodePanel from './WorkflowNodePanel';
import WorkflowPropertiesPanel from './WorkflowPropertiesPanel';

// 注册自定义节点
const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
  start: StartNode,
  end: EndNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'start',
    data: { label: '开始' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'end',
    type: 'end',
    data: { label: '结束' },
    position: { x: 0, y: 300 },
  },
];

interface WorkflowEditorProps {
  onSave?: (workflow: Workflow) => void;
}

export default function WorkflowEditor({ onSave }: WorkflowEditorProps) {
  const { id } = useParams<{ id: string }>();
  const isNewWorkflow = id === 'new';
  const navigate = useNavigate();

  // 工作流属性
  const [workflowName, setWorkflowName] = useState('新工作流');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [originalWorkflow, setOriginalWorkflow] = useState<Workflow | null>(null);

  // 节点和边状态
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // 侧边栏状态
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  
  // 历史记录
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // React Flow 实例
  const reactFlowInstance = useRef(null);

  // 加载工作流
  useEffect(() => {
    if (!isNewWorkflow && id) {
      const workflow = workflowService.getWorkflow(id);
      if (workflow) {
        setOriginalWorkflow(workflow);
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || '');
        
        // 转换节点
        const flowNodes = workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: { 
            label: node.label,
            description: node.description,
            ...node.config 
          },
          position: { x: node.x, y: node.y },
        }));
        
        // 转换边
        const flowEdges = workflow.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          data: { condition: edge.condition },
        }));
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        addToHistory(flowNodes, flowEdges);
      } else {
        // 工作流不存在，返回列表
        navigate('/workflow');
      }
    } else {
      // 新工作流，初始化
      addToHistory(initialNodes, []);
    }
  }, [id, isNewWorkflow, navigate]);

  // 添加到历史记录
  const addToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setHistory(prev => {
      // 移除当前索引之后的历史记录
      const newHistory = prev.slice(0, historyIndex + 1);
      // 添加新状态
      return [...newHistory, { nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // 处理节点变化
  const handleNodesChange = (changes: NodeChange[]) => {
    onNodesChange(changes);
    // 选择节点
    const selectChange = changes.find(change => change.type === 'select');
    if (selectChange && 'id' in selectChange) {
      const selected = nodes.find(node => node.id === selectChange.id);
      setSelectedNode(selected || null);
    }
  };

  // 处理边变化
  const handleEdgesChange = (changes: EdgeChange[]) => {
    onEdgesChange(changes);
  };

  // 添加连接
  const handleConnect = (connection: Connection) => {
    const newEdge = {
      ...connection,
      id: `e-${Date.now()}`,
      label: '',
    };
    const newEdges = addEdge(newEdge, edges);
    setEdges(newEdges);
    addToHistory(nodes, newEdges);
  };

  // 添加节点
  const handleAddNode = (type: WorkflowNodeType, name: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      data: { label: name },
      position: { x: 100, y: 100 },
    };
    
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    addToHistory(newNodes, edges);
  };

  // 更新节点
  const handleUpdateNode = (updatedNode: Node) => {
    const newNodes = nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    );
    setNodes(newNodes);
    addToHistory(newNodes, edges);
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const { nodes: prevNodes, edges: prevEdges } = history[newIndex];
      setNodes(prevNodes);
      setEdges(prevEdges);
      setHistoryIndex(newIndex);
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const { nodes: nextNodes, edges: nextEdges } = history[newIndex];
      setNodes(nextNodes);
      setEdges(nextEdges);
      setHistoryIndex(newIndex);
    }
  };

  // 保存工作流
  const handleSaveWorkflow = () => {
    // 转换节点
    const workflowNodes: WorkflowNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type as WorkflowNodeType,
      label: node.data.label,
      description: node.data.description,
      config: Object.keys(node.data).reduce((config, key) => {
        if (key !== 'label' && key !== 'description') {
          config[key] = node.data[key];
        }
        return config;
      }, {} as Record<string, any>),
      x: node.position.x,
      y: node.position.y,
    }));

    // 转换边
    const workflowEdges: WorkflowEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      condition: edge.data?.condition,
    }));

    const workflow: Workflow = {
      id: originalWorkflow?.id || `wf-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      nodes: workflowNodes,
      edges: workflowEdges,
      createdAt: originalWorkflow?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // 保存工作流
    if (originalWorkflow) {
      workflowService.updateWorkflow(workflow);
    } else {
      workflowService.createWorkflow(workflow);
    }

    // 调用回调
    if (onSave) {
      onSave(workflow);
    }

    // 导航回列表
    navigate('/workflow');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 工具栏 */}
      <div className="border-b p-2 flex justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label htmlFor="workflowName">工作流名称</Label>
            <Input
              id="workflowName"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="workflowDescription">描述</Label>
            <Input
              id="workflowDescription"
              value={workflowDescription}
              onChange={e => setWorkflowDescription(e.target.value)}
              className="w-96"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleUndo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4 mr-1" />
            撤销
          </Button>
          <Button variant="outline" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4 mr-1" />
            重做
          </Button>
          <Button onClick={handleSaveWorkflow}>
            <Save className="h-4 w-4 mr-1" />
            保存
          </Button>
        </div>
      </div>

      {/* 编辑器布局 */}
      <div className="flex flex-grow">
        {/* 节点面板 */}
        {showNodePanel && (
          <WorkflowNodePanel onAddNode={handleAddNode} />
        )}

        {/* 流程图编辑器 */}
        <div className="flex-grow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Controls position="bottom-right" />
            <MiniMap position="bottom-left" />
            <Background />
            <Panel position="top-right" className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowNodePanel(!showNodePanel)}
                title="显示/隐藏节点面板"
              >
                <Plus size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                title="显示/隐藏属性面板"
              >
                <ZoomIn size={16} />
              </Button>
            </Panel>
          </ReactFlow>
        </div>

        {/* 属性面板 */}
        {showPropertiesPanel && selectedNode && (
          <WorkflowPropertiesPanel
            node={selectedNode}
            onUpdateNode={handleUpdateNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
} 