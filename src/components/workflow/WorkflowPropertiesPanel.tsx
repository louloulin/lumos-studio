import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Node } from 'reactflow';
import { WorkflowNodeType } from '@/api/WorkflowService';
import { agentService } from '@/api/AgentService';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Agent } from '@/api/types';

interface WorkflowPropertiesProps {
  node: Node;
  onUpdateNode: (node: Node) => void;
  onClose: () => void;
}

export default function WorkflowPropertiesPanel({ node, onUpdateNode, onClose }: WorkflowPropertiesProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // 加载智能体列表
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const allAgents = await agentService.getAllAgents();
        setAgents(allAgents);
      } catch (error) {
        console.error('加载智能体失败:', error);
      }
    };
    
    if (node.type === WorkflowNodeType.AGENT) {
      loadAgents();
    }
  }, [node.type]);
  
  // 更新节点标签
  const handleLabelChange = (value: string) => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        label: value
      }
    };
    onUpdateNode(updatedNode);
  };
  
  // 更新节点描述
  const handleDescriptionChange = (value: string) => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        description: value
      }
    };
    onUpdateNode(updatedNode);
  };
  
  // 更新智能体节点的智能体ID
  const handleAgentChange = (agentId: string) => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        agentId
      }
    };
    onUpdateNode(updatedNode);
  };
  
  // 更新智能体节点的指令
  const handleInstructionsChange = (instructions: string) => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        instructions
      }
    };
    onUpdateNode(updatedNode);
  };
  
  // 更新工具节点的代码
  const handleToolCodeChange = (toolCode: string) => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        toolCode
      }
    };
    onUpdateNode(updatedNode);
  };
  
  // 更新条件节点的代码
  const handleConditionCodeChange = (conditionCode: string) => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        conditionCode
      }
    };
    onUpdateNode(updatedNode);
  };
  
  // 渲染通用属性
  const renderCommonProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nodeLabel">节点名称</Label>
        <Input
          id="nodeLabel"
          value={node.data.label || ''}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="节点名称"
        />
      </div>
      <div>
        <Label htmlFor="nodeDescription">描述</Label>
        <Textarea
          id="nodeDescription"
          value={node.data.description || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="节点描述"
          rows={3}
        />
      </div>
    </div>
  );
  
  // 渲染智能体节点属性
  const renderAgentProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="agentId">选择智能体</Label>
        <Select
          value={node.data.agentId || ''}
          onValueChange={handleAgentChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择智能体" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="instructions">智能体指令</Label>
        <Textarea
          id="instructions"
          value={node.data.instructions || ''}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="输入给智能体的指令"
          rows={5}
        />
      </div>
    </div>
  );
  
  // 渲染工具节点属性
  const renderToolProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="toolCode">工具代码</Label>
        <Textarea
          id="toolCode"
          value={node.data.toolCode || ''}
          onChange={(e) => handleToolCodeChange(e.target.value)}
          placeholder="// 输入工具代码"
          className="font-mono text-sm"
          rows={10}
        />
        <p className="text-xs text-gray-500 mt-1">
          在这里编写工具的执行代码。您可以使用变量 `input` 获取输入数据，并使用 `return` 返回结果。
        </p>
      </div>
    </div>
  );
  
  // 渲染条件节点属性
  const renderConditionProperties = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="conditionCode">条件代码</Label>
        <Textarea
          id="conditionCode"
          value={node.data.conditionCode || ''}
          onChange={(e) => handleConditionCodeChange(e.target.value)}
          placeholder="// 输入条件评估代码"
          className="font-mono text-sm"
          rows={10}
        />
        <p className="text-xs text-gray-500 mt-1">
          编写条件评估逻辑。您可以使用变量 `input` 获取输入数据，并返回布尔值 `true` 或 `false`。
        </p>
      </div>
    </div>
  );
  
  // 基于节点类型渲染特定属性
  const renderSpecificProperties = () => {
    switch (node.type) {
      case WorkflowNodeType.AGENT:
        return renderAgentProperties();
      case WorkflowNodeType.TOOL:
        return renderToolProperties();
      case WorkflowNodeType.CONDITION:
        return renderConditionProperties();
      default:
        return null;
    }
  };
  
  return (
    <div className="w-80 border-l h-full overflow-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">节点属性</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs defaultValue="common">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="common">基本</TabsTrigger>
            <TabsTrigger value="specific">高级</TabsTrigger>
          </TabsList>
          
          <TabsContent value="common" className="space-y-4 pt-4">
            {renderCommonProperties()}
          </TabsContent>
          
          <TabsContent value="specific" className="space-y-4 pt-4">
            {renderSpecificProperties()}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>节点类型: {node.type}</p>
          <p>节点ID: {node.id}</p>
        </div>
      </div>
    </div>
  );
} 