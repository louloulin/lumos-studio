import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowNodeType } from '@/api/WorkflowService';
import { Settings, Wrench, GitBranch, SquareTerminal, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface WorkflowNodePanelProps {
  onAddNode: (type: WorkflowNodeType, name: string) => void;
}

export default function WorkflowNodePanel({ onAddNode }: WorkflowNodePanelProps) {
  const [nodeName, setNodeName] = useState('');

  const handleAddNode = (type: WorkflowNodeType) => {
    if (!nodeName.trim()) {
      return;
    }

    onAddNode(type, nodeName);
    setNodeName('');
  };

  return (
    <div className="w-64 border-r h-full overflow-auto">
      <div className="p-4">
        <h2 className="text-lg font-medium mb-4">添加节点</h2>

        <div className="mb-4">
          <Label htmlFor="nodeName">节点名称</Label>
          <Input
            id="nodeName"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="输入节点名称"
            className="mb-2"
          />
        </div>

        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">基础</TabsTrigger>
            <TabsTrigger value="advanced">高级</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-2 pt-2">
            <Card>
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddNode(WorkflowNodeType.AGENT)}
                  disabled={!nodeName.trim()}
                >
                  <MessageSquare className="h-4 w-4" />
                  智能体节点
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddNode(WorkflowNodeType.TOOL)}
                  disabled={!nodeName.trim()}
                >
                  <Wrench className="h-4 w-4" />
                  工具节点
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddNode(WorkflowNodeType.CONDITION)}
                  disabled={!nodeName.trim()}
                >
                  <GitBranch className="h-4 w-4" />
                  条件节点
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-2 pt-2">
            <Card>
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddNode(WorkflowNodeType.INPUT)}
                  disabled={!nodeName.trim()}
                >
                  <Settings className="h-4 w-4" />
                  输入节点
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddNode(WorkflowNodeType.OUTPUT)}
                  disabled={!nodeName.trim()}
                >
                  <Settings className="h-4 w-4" />
                  输出节点
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddNode(WorkflowNodeType.LOOP)}
                  disabled={!nodeName.trim()}
                >
                  <SquareTerminal className="h-4 w-4" />
                  循环节点
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 