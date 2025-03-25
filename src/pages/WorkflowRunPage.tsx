import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Workflow, workflowService } from '@/api/WorkflowService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Play, Circle, CheckCircle } from 'lucide-react';

export default function WorkflowRunPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // 加载工作流
  useEffect(() => {
    if (id) {
      const loadedWorkflow = workflowService.getWorkflow(id);
      if (loadedWorkflow) {
        setWorkflow(loadedWorkflow);
      } else {
        setError('找不到指定的工作流');
      }
    }
  }, [id]);
  
  // 执行工作流
  const handleRunWorkflow = async () => {
    if (!workflow) return;
    
    setIsRunning(true);
    setError(null);
    setOutput('');
    setLogs([`开始执行工作流: ${workflow.name}`]);
    
    try {
      // 模拟工作流执行过程
      setLogs(prev => [...prev, '初始化工作流执行环境...']);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 遍历节点并模拟执行
      const startNode = workflow.nodes.find(node => node.type === 'start');
      if (!startNode) {
        throw new Error('工作流缺少开始节点');
      }
      
      setLogs(prev => [...prev, `执行节点: ${startNode.label}`]);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟节点执行过程
      let currentNodeId = startNode.id;
      let currentInput = input;
      
      while (currentNodeId) {
        // 查找当前节点
        const currentNode = workflow.nodes.find(node => node.id === currentNodeId);
        if (!currentNode) break;
        
        // 如果是结束节点，完成执行
        if (currentNode.type === 'end') {
          setLogs(prev => [...prev, `执行节点: ${currentNode.label} (结束)`]);
          setOutput(currentInput);
          break;
        }
        
        // 记录节点执行
        setLogs(prev => [...prev, `执行节点: ${currentNode.label} (${currentNode.type})`]);
        
        // 模拟节点执行逻辑
        switch (currentNode.type) {
          case 'agent':
            setLogs(prev => [...prev, `  调用智能体: ${currentNode.config?.agentId || '未指定'}`]);
            await new Promise(resolve => setTimeout(resolve, 1500));
            currentInput = `智能体回复: 已处理输入 "${currentInput}"`;
            break;
            
          case 'tool':
            setLogs(prev => [...prev, '  执行工具操作']);
            await new Promise(resolve => setTimeout(resolve, 1000));
            currentInput = `工具处理结果: ${currentInput}`;
            break;
            
          case 'condition':
            setLogs(prev => [...prev, '  评估条件']);
            await new Promise(resolve => setTimeout(resolve, 800));
            // 随机决定条件结果
            const conditionResult = Math.random() > 0.5;
            setLogs(prev => [...prev, `  条件结果: ${conditionResult ? '为真' : '为假'}`]);
            break;
            
          default:
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 查找下一个节点（这里简化为找到第一个以当前节点为源的边）
        const nextEdge = workflow.edges.find(edge => edge.source === currentNodeId);
        currentNodeId = nextEdge?.target || '';
        
        // 随机延迟模拟执行时间
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      }
      
      setLogs(prev => [...prev, '工作流执行完成']);
      
      // 实际执行时，使用 workflowService.executeWorkflow
      // const result = await workflowService.executeWorkflow(workflow.id, input);
      // setOutput(result.result);
      
    } catch (err) {
      console.error('执行工作流失败:', err);
      setError(err instanceof Error ? err.message : '执行工作流时发生错误');
      setLogs(prev => [...prev, `错误: ${err instanceof Error ? err.message : '未知错误'}`]);
    } finally {
      setIsRunning(false);
    }
  };
  
  if (!workflow && !error) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
            <p className="text-center mt-4">加载工作流...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/workflow')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold">{workflow?.name || '工作流执行'}</h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>工作流信息</CardTitle>
              {workflow && (
                <CardDescription>
                  {workflow.description || '无描述'}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {workflow && (
                <div className="space-y-2">
                  <p>节点数量: {workflow.nodes.length}</p>
                  <p>连接数量: {workflow.edges.length}</p>
                  <p>创建时间: {new Date(workflow.createdAt).toLocaleString()}</p>
                  <p>更新时间: {new Date(workflow.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>输入</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="workflowInput">输入文本</Label>
                <Textarea
                  id="workflowInput"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入工作流处理的文本..."
                  rows={5}
                  disabled={isRunning}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleRunWorkflow} 
                disabled={isRunning || !input.trim()}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Circle className="mr-2 h-4 w-4 animate-pulse" />
                    执行中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    执行工作流
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>输出</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="workflowOutput">输出结果</Label>
                <div
                  id="workflowOutput"
                  className="border rounded-md p-3 min-h-[120px] bg-gray-50"
                >
                  {output ? (
                    <p>{output}</p>
                  ) : (
                    <p className="text-gray-400">
                      {isRunning ? '处理中...' : '执行工作流后将显示结果'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>执行日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-3 bg-black text-white font-mono text-sm h-64 overflow-auto">
                {logs.length > 0 ? (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="flex">
                        <span className="text-gray-500 mr-2">[{index + 1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    {isRunning && (
                      <div className="animate-pulse text-green-400">
                        ▶ 执行中...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    执行工作流后将显示日志
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <div>
                {isRunning ? (
                  <span className="text-blue-500 flex items-center">
                    <Circle className="animate-pulse mr-2 h-4 w-4" />
                    执行中...
                  </span>
                ) : logs.length > 0 ? (
                  <span className="text-green-500 flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    完成
                  </span>
                ) : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogs([])}
                disabled={logs.length === 0 || isRunning}
              >
                清除日志
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}