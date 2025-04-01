import React, { useEffect, useState } from 'react';
import { Node } from 'reactflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toolService, Tool } from '@/api/ToolService';

interface WorkflowPropertiesPanelProps {
  node: Node;
  onUpdateNode: (node: Node) => void;
  onClose: () => void;
}

const WorkflowPropertiesPanel: React.FC<WorkflowPropertiesPanelProps> = ({
  node,
  onUpdateNode,
  onClose
}) => {
  const [label, setLabel] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [localTools, setLocalTools] = useState<Tool[]>([]);
  const [mastraTools, setMastraTools] = useState<string[]>([]);
  const [selectedToolId, setSelectedToolId] = useState(node.data.toolId || '');
  const [params, setParams] = useState<Record<string, any>>(node.data.params || {});
  const [loading, setLoading] = useState(false);

  // 加载工具数据
  useEffect(() => {
    const loadTools = async () => {
      setLoading(true);
      try {
        const tools = toolService.getAllTools();
        setLocalTools(tools);
        
        const remoteMastraTools = await toolService.getMastraTools();
        setMastraTools(remoteMastraTools);
      } catch (error) {
        console.error('加载工具失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTools();
  }, []);

  // 当选择工具改变时，重置参数
  useEffect(() => {
    if (selectedToolId && selectedToolId !== node.data.toolId) {
      // 查找本地工具
      const tool = localTools.find(t => t.id === selectedToolId);
      
      if (tool && tool.parameters) {
        // 使用工具的参数定义初始化参数对象
        const initialParams: Record<string, any> = {};
        tool.parameters.forEach(param => {
          initialParams[param.name] = param.defaultValue || '';
        });
        setParams(initialParams);
      } else {
        // 如果是Mastra工具或没找到工具，清空参数
        setParams({});
      }
    }
  }, [selectedToolId, localTools, node.data.toolId]);

  // 更新节点
  const handleUpdate = () => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        label,
        description,
        toolId: selectedToolId,
        params
      }
    };
    
    onUpdateNode(updatedNode);
  };

  // 更新参数
  const handleParamChange = (paramName: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // 渲染不同类型节点的特定属性
  const renderNodeTypeProperties = () => {
    if (node.type === 'tool') {
      return (
        <>
          <div className="mb-4">
            <Label htmlFor="tool-select">选择工具</Label>
            <Select
              value={selectedToolId}
              onValueChange={setSelectedToolId}
            >
              <SelectTrigger id="tool-select" className="mt-1">
                <SelectValue placeholder="选择要使用的工具" />
              </SelectTrigger>
              <SelectContent>
                {localTools.length > 0 && (
                  <>
                    <SelectItem value="local-tools-header" disabled>-- 本地工具 --</SelectItem>
                    {localTools.map(tool => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.icon && <span className="mr-2">{tool.icon}</span>}
                        {tool.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {mastraTools.length > 0 && (
                  <>
                    <SelectItem value="mastra-tools-header" disabled>-- Mastra工具 --</SelectItem>
                    {mastraTools.map(toolId => (
                      <SelectItem key={toolId} value={toolId}>
                        {toolId}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedToolId && (
            <>
              <Separator className="my-4" />
              <div>
                <Label className="mb-2 block">工具参数</Label>
                {/* 渲染选中工具的参数 */}
                {renderToolParameters()}
              </div>
            </>
          )}
        </>
      );
    }
    
    return null;
  };

  // 渲染工具参数
  const renderToolParameters = () => {
    const tool = localTools.find(t => t.id === selectedToolId);
    
    if (tool && tool.parameters && tool.parameters.length > 0) {
      return (
        <div className="space-y-4">
          {tool.parameters.map(param => (
            <div key={param.name}>
              <Label htmlFor={`param-${param.name}`}>
                {param.name}{param.required ? ' *' : ''}
              </Label>
              <div className="text-xs text-muted-foreground mb-1">
                {param.description} ({param.type})
              </div>
              <Input
                id={`param-${param.name}`}
                value={params[param.name] || ''}
                onChange={e => handleParamChange(param.name, e.target.value)}
                placeholder={`输入${param.name}值`}
              />
            </div>
          ))}
        </div>
      );
    }
    
    if (mastraTools.includes(selectedToolId)) {
      return (
        <div className="p-4 border rounded-md border-dashed text-center">
          <p className="text-sm text-muted-foreground">
            Mastra工具参数可以在运行时配置
          </p>
        </div>
      );
    }
    
    return (
      <div className="p-4 border rounded-md border-dashed text-center">
        <p className="text-sm text-muted-foreground">
          此工具没有可配置的参数
        </p>
      </div>
    );
  };

  return (
    <div className="w-80 border-l border-border">
      <Card className="border-none rounded-none h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3 border-b">
          <div>
            <CardTitle className="text-base">节点属性</CardTitle>
            <CardDescription>{node.type}节点</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* 通用属性 */}
          <div>
            <Label htmlFor="node-label">标签</Label>
            <Input
              id="node-label"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="节点标签"
            />
          </div>
          
          <div>
            <Label htmlFor="node-description">描述</Label>
            <Textarea
              id="node-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="节点描述"
              rows={3}
            />
          </div>
          
          {/* 节点类型特定属性 */}
          {renderNodeTypeProperties()}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdate}
            >
              更新
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowPropertiesPanel; 