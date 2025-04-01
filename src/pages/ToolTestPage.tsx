import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Play, Terminal, Trash2, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tool, toolService } from '@/api/ToolService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ToolTestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<Array<{
    params: Record<string, any>,
    result: string,
    timestamp: number
  }>>([]);

  // 加载工具
  useEffect(() => {
    const loadTool = async () => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error('工具ID未提供');
        }
        
        const loadedTool = await toolService.getTool(id);
        if (!loadedTool) {
          throw new Error('找不到工具');
        }
        
        setTool(loadedTool);
        
        // 初始化参数值
        const initialParams: Record<string, any> = {};
        loadedTool.parameters.forEach(param => {
          initialParams[param.name] = param.defaultValue || '';
        });
        setParamValues(initialParams);
        
        // 尝试从本地存储加载执行历史
        const historyKey = `tool_history_${id}`;
        const savedHistory = localStorage.getItem(historyKey);
        if (savedHistory) {
          try {
            const parsedHistory = JSON.parse(savedHistory);
            setExecutionHistory(parsedHistory);
          } catch (e) {
            console.error('无法解析工具执行历史:', e);
          }
        }
      } catch (error) {
        console.error('加载工具失败:', error);
        setError(`加载工具失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadTool();
  }, [id]);
  
  // 处理参数变化
  const handleParamChange = (name: string, value: any) => {
    setParamValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 执行工具
  const handleExecute = async () => {
    if (!tool) return;
    
    setExecuting(true);
    setResult(null);
    setError(null);
    
    try {
      // 检查必要参数
      const missingParams = tool.parameters
        .filter(p => p.required && !paramValues[p.name])
        .map(p => p.name);
      
      if (missingParams.length > 0) {
        throw new Error(`缺少必要参数: ${missingParams.join(', ')}`);
      }
      
      // 包装参数
      const params = {
        data: { ...paramValues }
      };
      
      // 执行工具
      const executionResult = await toolService.executeTool(tool.id, params);
      
      // 显示结果
      const resultStr = typeof executionResult === 'string' 
        ? executionResult 
        : JSON.stringify(executionResult, null, 2);
      
      setResult(resultStr);
      
      // 添加到历史记录
      const historyItem = {
        params: { ...paramValues },
        result: resultStr,
        timestamp: Date.now()
      };
      
      const updatedHistory = [historyItem, ...executionHistory.slice(0, 9)];
      setExecutionHistory(updatedHistory);
      
      // 保存到本地存储
      const historyKey = `tool_history_${tool.id}`;
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('执行工具失败:', error);
      setError(`执行工具失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setExecuting(false);
    }
  };
  
  // 返回工具列表
  const handleBack = () => {
    navigate('/tools');
  };
  
  // 应用历史记录
  const applyHistory = (historyItem: { params: Record<string, any> }) => {
    setParamValues(historyItem.params);
  };
  
  // 清除历史记录
  const clearHistory = () => {
    if (!tool) return;
    
    if (window.confirm('确定要清除执行历史吗？此操作无法撤销。')) {
      setExecutionHistory([]);
      const historyKey = `tool_history_${tool.id}`;
      localStorage.removeItem(historyKey);
    }
  };
  
  // 复制结果到剪贴板
  const copyResultToClipboard = () => {
    if (!result) return;
    
    navigator.clipboard.writeText(result)
      .then(() => {
        alert('已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }
  
  if (!tool) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error || '找不到工具'}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleBack}>返回工具列表</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold ml-2">测试工具: {tool.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 工具信息 */}
        <Card>
          <CardHeader>
            <CardTitle>工具信息</CardTitle>
            <CardDescription>{tool.description || '无描述'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <div className="flex items-start gap-2 mb-4">
                <Badge variant={tool.isBuiltin ? "secondary" : tool.isMastraTool ? "outline" : "default"}>
                  {tool.isBuiltin ? '内置工具' : tool.isMastraTool ? 'Mastra工具' : '自定义工具'}
                </Badge>
                <Badge variant="outline">ID: {tool.id}</Badge>
              </div>
              
              {tool.parameters.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">参数配置</h3>
                  {tool.parameters.map(param => (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={`param-${param.name}`}>
                        {param.name}
                        {param.required && <span className="text-destructive">*</span>}
                        <span className="text-xs ml-2 text-muted-foreground">({param.type})</span>
                      </Label>
                      {param.description && (
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                      )}
                      {param.type === 'string' || param.type === 'number' ? (
                        <Input
                          id={`param-${param.name}`}
                          type={param.type === 'number' ? 'number' : 'text'}
                          value={paramValues[param.name] || ''}
                          onChange={(e) => handleParamChange(param.name, e.target.value)}
                          placeholder={`输入${param.name}...`}
                        />
                      ) : param.type === 'boolean' ? (
                        <select
                          id={`param-${param.name}`}
                          value={paramValues[param.name] ? 'true' : 'false'}
                          onChange={(e) => handleParamChange(param.name, e.target.value === 'true')}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      ) : (
                        <Textarea
                          id={`param-${param.name}`}
                          value={paramValues[param.name] ? JSON.stringify(paramValues[param.name], null, 2) : ''}
                          onChange={(e) => {
                            try {
                              handleParamChange(param.name, JSON.parse(e.target.value));
                            } catch {
                              handleParamChange(param.name, e.target.value);
                            }
                          }}
                          placeholder={`输入${param.type} (JSON格式)...`}
                          rows={4}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">此工具不需要参数</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleExecute}
              disabled={executing}
            >
              {executing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  执行中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  执行工具
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* 执行结果 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>执行结果</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="relative min-h-[280px] bg-muted rounded-md p-4 font-mono text-sm overflow-auto">
                {result ? (
                  <pre className="whitespace-pre-wrap break-all">{result}</pre>
                ) : (
                  <p className="text-muted-foreground">点击执行按钮查看结果</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              {result && (
                <Button variant="outline" size="sm" onClick={copyResultToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制结果
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* 执行历史 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>执行历史</CardTitle>
                <CardDescription>最近的10次执行记录</CardDescription>
              </div>
              {executionHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  清除历史
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {executionHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">暂无执行记录</p>
              ) : (
                <div className="space-y-2">
                  {executionHistory.map((item, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => applyHistory(item)}>
                          应用参数
                        </Button>
                      </div>
                      <div className="text-xs bg-muted p-2 rounded-md max-h-20 overflow-auto">
                        <pre>{JSON.stringify(item.params, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 