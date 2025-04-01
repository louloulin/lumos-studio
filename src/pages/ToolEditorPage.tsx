import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  ArrowLeft, Plus, Save, Trash2, Play, Terminal
} from 'lucide-react';
import { Tool, ToolParameter, toolService } from '@/api/ToolService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

// 参数类型选项
const PARAMETER_TYPES = [
  { value: 'string', label: '文本 (string)' },
  { value: 'number', label: '数字 (number)' },
  { value: 'boolean', label: '布尔值 (boolean)' },
  { value: 'object', label: '对象 (object)' },
  { value: 'array', label: '数组 (array)' }
];

export default function ToolEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // 工具编辑状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState<ToolParameter[]>([]);
  
  // 测试状态
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testParameters, setTestParameters] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  
  // 新参数对话框
  const [isAddParamDialogOpen, setIsAddParamDialogOpen] = useState(false);
  const [newParam, setNewParam] = useState<ToolParameter>({
    name: '',
    type: 'string' as 'string' | 'number' | 'boolean' | 'object' | 'array',
    description: '',
    required: true
  });
  
  // 加载工具
  useEffect(() => {
    const loadTool = async () => {
      setIsLoading(true);
      
      if (id === 'new') {
        // 新工具
        const newTool: Tool = {
          id: `tool-${Date.now()}`,
          name: '新工具',
          description: '',
          parameters: [],
          execute: async () => '工具执行结果'
        };
        
        setTool(newTool);
        setName(newTool.name);
        setDescription(newTool.description || '');
        setParameters(newTool.parameters || []);
      } else if (id) {
        // 加载已有工具
        try {
          const loadedTool = await toolService.getTool(id);
          if (loadedTool) {
            setTool(loadedTool);
            setName(loadedTool.name);
            setDescription(loadedTool.description || '');
            setParameters(loadedTool.parameters || []);
          } else {
            navigate('/tools');
          }
        } catch (error) {
          console.error('加载工具失败:', error);
          navigate('/tools');
        }
      }
      
      setIsLoading(false);
    };
    
    loadTool();
  }, [id, navigate]);
  
  // 保存工具
  const handleSave = async () => {
    if (!tool) return;
    
    setIsSaving(true);
    
    const updatedTool: Tool = {
      ...tool,
      name,
      description,
      parameters
    };
    
    try {
      // 新工具或更新工具
      if (id === 'new') {
        // 创建新工具
        const savedTool = toolService.registerCustomTool(
          updatedTool.name,
          updatedTool.description || '',
          updatedTool.parameters
        );
        
        if (savedTool) {
          setTool(savedTool);
          // 显示保存成功
          setTimeout(() => {
            navigate('/tools');
          }, 1000);
        }
      } else {
        // 更新现有工具
        const existingTool = await toolService.getTool(updatedTool.id);
        if (existingTool) {
          const savedTool = toolService.registerTool({
            ...existingTool,
            name: updatedTool.name,
            description: updatedTool.description,
            parameters: updatedTool.parameters
          });
          
          if (savedTool) {
            setTool(savedTool);
            // 显示保存成功
            setTimeout(() => {
              navigate('/tools');
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('保存工具失败:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 添加参数
  const handleAddParameter = () => {
    if (!newParam.name.trim()) return;
    
    setParameters([...parameters, { ...newParam }]);
    setNewParam({
      name: '',
      type: 'string',
      description: '',
      required: true
    });
    setIsAddParamDialogOpen(false);
  };
  
  // 删除参数
  const handleDeleteParameter = (index: number) => {
    const newParameters = [...parameters];
    newParameters.splice(index, 1);
    setParameters(newParameters);
  };
  
  // 测试工具
  const handleTestTool = async () => {
    if (!tool) return;
    
    setIsRunningTest(true);
    setTestResult(null);
    setTestError(null);
    
    try {
      // 包装参数
      const params = {
        data: { ...testParameters }
      };
      
      const result = await toolService.executeTool(tool.id, params);
      setTestResult(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('测试工具失败:', error);
      setTestError(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRunningTest(false);
    }
  };
  
  // 更新测试参数
  const handleTestParamChange = (name: string, value: any) => {
    setTestParameters({
      ...testParameters,
      [name]: value
    });
  };
  
  // 导航回工具列表
  const handleBack = () => {
    navigate('/tools');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-semibold ml-2">
            {id === 'new' ? '创建工具' : `编辑工具: ${tool?.name}`}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTestDialogOpen(true)}>
            <Terminal className="w-4 h-4 mr-2" />
            测试工具
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '保存中...' : '保存工具'}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">基本信息</TabsTrigger>
          <TabsTrigger value="parameters">参数配置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                配置工具的基本信息和描述
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tool-name">工具名称</Label>
                <Input
                  id="tool-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入工具名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tool-description">工具描述</Label>
                <Textarea
                  id="tool-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述这个工具的功能和用途"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parameters" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>参数配置</CardTitle>
                <CardDescription>
                  定义工具所需的输入参数
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddParamDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加参数
              </Button>
            </CardHeader>
            <CardContent>
              {parameters.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>没有配置参数</p>
                  <p className="text-sm">点击"添加参数"按钮来定义工具需要的输入参数</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>参数名</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>必填</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parameters.map((param, index) => (
                        <TableRow key={index}>
                          <TableCell>{param.name}</TableCell>
                          <TableCell>{param.type}</TableCell>
                          <TableCell>{param.description || '-'}</TableCell>
                          <TableCell>{param.required ? '是' : '否'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteParameter(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 添加参数对话框 */}
      <Dialog open={isAddParamDialogOpen} onOpenChange={setIsAddParamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加参数</DialogTitle>
            <DialogDescription>
              定义工具所需的输入参数
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="param-name">参数名称</Label>
              <Input
                id="param-name"
                value={newParam.name}
                onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                placeholder="输入参数名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="param-type">参数类型</Label>
              <Select
                value={newParam.type}
                onValueChange={(value) => setNewParam({ ...newParam, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择参数类型" />
                </SelectTrigger>
                <SelectContent>
                  {PARAMETER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="param-description">参数描述</Label>
              <Input
                id="param-description"
                value={newParam.description || ''}
                onChange={(e) => setNewParam({ ...newParam, description: e.target.value })}
                placeholder="描述这个参数的用途"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="param-required" 
                checked={newParam.required}
                onCheckedChange={(checked) => 
                  setNewParam({ ...newParam, required: Boolean(checked) })
                }
              />
              <Label htmlFor="param-required">必填参数</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddParamDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddParameter}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 测试工具对话框 */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>测试工具</DialogTitle>
            <DialogDescription>
              输入参数并测试工具执行结果
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <h3 className="font-medium">参数输入</h3>
              {parameters.length === 0 ? (
                <p className="text-sm text-muted-foreground">该工具没有定义参数</p>
              ) : (
                <div className="space-y-4">
                  {parameters.map((param, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`test-param-${param.name}`}>
                        {param.name}
                        {param.required && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id={`test-param-${param.name}`}
                        placeholder={param.description || `输入${param.name}`}
                        value={testParameters[param.name] || ''}
                        onChange={(e) => handleTestParamChange(param.name, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button 
                onClick={handleTestTool} 
                disabled={isRunningTest}
                className="w-full"
              >
                {isRunningTest ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    执行中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    执行工具
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">执行结果</h3>
              {testError && (
                <Alert variant="destructive">
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}
              <div className="relative min-h-[200px] bg-muted p-4 rounded-md">
                {testResult ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                    {testResult}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">点击"执行工具"按钮查看结果</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 