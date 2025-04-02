import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { 
  Save, ArrowLeft, Trash2, Wrench, MessageSquare, Brain, Database, 
  Upload, Image, Info, Settings, AlertCircle, Plus, X, Hash, Calendar, Link, Package, BookOpen
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Agent, AgentTool, AgentType } from '@/api/types';
import { agentService } from '@/api/AgentService';
import { toolService, Tool, ToolParameter } from '@/api/ToolService';

// 模拟大型语言模型选项
const modelOptions = [
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus (Anthropic)' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet (Anthropic)' },
  { value: 'gemini-pro', label: 'Gemini Pro (Google)' },
  { value: 'llama-3-70b', label: 'Llama 3 70B (Meta)' },
  { value: 'mistral-large', label: 'Mistral Large' },
];

// 智能体类型选项
const agentTypeOptions = Object.entries(AgentType).map(([key, value]) => ({
  value,
  label: key
}));

// 分类标签选项
const categoryOptions = [
  '工具', '创意', '开发', '学术', '商业', '生活', '教育', '翻译', 
  '写作', '数据分析', '内容创作', 'AI研究', '金融', '医疗', '法律'
];

// 默认智能体配置
const defaultAgent: Agent = {
  id: 'new-agent',
  name: '新建智能体',
  description: '这是一个新建的智能体，您可以根据需要自定义它的行为和功能。',
  instructions: '你是一个有用的AI助手，专注于提供准确和有帮助的回答。请始终保持友好和专业的态度。',
  model: 'gpt-4-turbo',
  type: AgentType.General,
  temperature: 0.7,
  maxTokens: 4000,
  tools: [],
  systemAgent: false,
  categories: ['工具'],
  version: '1.0.0',
  author: '',
  welcomeMessage: '你好！我是你的AI助手，有什么可以帮助你的吗？',
  examples: ['我该如何使用这个智能体？', '你能做什么？'],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

interface AgentEditorProps {
  agentId?: string;
  onSave?: (agent: Agent) => void;
  onCancel?: () => void;
}

const AgentEditor: React.FC<AgentEditorProps> = ({ agentId, onSave, onCancel }) => {
  const [agent, setAgent] = useState<Agent>(defaultAgent);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [mastraTools, setMastraTools] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('basic'); // 'basic', 'model', 'tools', 'advanced'
  const [newCategory, setNewCategory] = useState('');
  const [newExample, setNewExample] = useState('');

  // 加载智能体数据和可用工具
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        // 加载本地工具和Mastra工具
        const localTools = await toolService.getAllTools();
        
        setAvailableTools(localTools);
        
        // 设置Mastra工具ID数组
        const mastraToolIds = localTools
          .filter(tool => tool.isMastraTool)
          .map(tool => tool.id);
        setMastraTools(mastraToolIds);
        
        // 加载智能体
        if (agentId && agentId !== 'new-agent') {
          const loadedAgent = await agentService.getAgent(agentId);
          if (loadedAgent) {
            // 确保Agent有所有必要字段
            setAgent({
              ...defaultAgent,
              ...loadedAgent,
              updatedAt: Date.now() // 更新时间戳
            });
          }
        } else {
          // 为新智能体设置默认工具集 - 前两个内置工具
          const builtinTools = localTools.filter(tool => tool.isBuiltin).slice(0, 2);
          setAgent(prev => ({
            ...prev,
            tools: builtinTools.map(tool => ({
              id: tool.id,
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
              enabled: false
            }))
          }));
        }
      } catch (error) {
        console.error('初始化智能体编辑器失败:', error);
        setErrorMessage('加载数据时出错，请重试。');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, [agentId]);

  // 更新基本信息
  const updateBasicInfo = (field: keyof Agent, value: any) => {
    setAgent(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // 更新工具状态
  const updateToolStatus = (toolId: string, enabled: boolean) => {
    if (!agent.tools) return;
    
    setAgent(prev => ({
      ...prev,
      tools: prev.tools?.map(tool => 
        tool.id === toolId ? { ...tool, enabled } : tool
      )
    }));
    setIsDirty(true);
  };

  // 添加工具到智能体
  const addToolToAgent = (toolId: string) => {
    // 检查工具是否已存在
    if (agent.tools?.some(tool => tool.id === toolId)) {
      return;
    }
    
    // 查找工具
    const tool = availableTools.find(t => t.id === toolId);
    
    if (tool) {
      // 添加本地工具
      setAgent(prev => ({
        ...prev,
        tools: [
          ...(prev.tools || []),
          {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            enabled: true
          }
        ]
      }));
    } else if (mastraTools.includes(toolId)) {
      // 添加Mastra工具
      setAgent(prev => ({
        ...prev,
        tools: [
          ...(prev.tools || []),
          {
            id: toolId,
            name: toolId,
            description: `Mastra工具: ${toolId}`,
            parameters: [],
            enabled: true
          }
        ]
      }));
    }
    
    setIsDirty(true);
  };

  // 从智能体移除工具
  const removeToolFromAgent = (toolId: string) => {
    setAgent(prev => ({
      ...prev,
      tools: prev.tools?.filter(tool => tool.id !== toolId) || []
    }));
    
    setIsDirty(true);
  };

  // 添加分类
  const addCategory = () => {
    if (newCategory && !agent.categories?.includes(newCategory)) {
      setAgent(prev => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory]
      }));
      setNewCategory('');
      setIsDirty(true);
    }
  };

  // 移除分类
  const removeCategory = (category: string) => {
    setAgent(prev => ({
      ...prev,
      categories: prev.categories?.filter(c => c !== category) || []
    }));
    setIsDirty(true);
  };

  // 添加示例问题
  const addExample = () => {
    if (newExample && !agent.examples?.includes(newExample)) {
      setAgent(prev => ({
        ...prev,
        examples: [...(prev.examples || []), newExample]
      }));
      setNewExample('');
      setIsDirty(true);
    }
  };

  // 移除示例问题
  const removeExample = (example: string) => {
    setAgent(prev => ({
      ...prev,
      examples: prev.examples?.filter(e => e !== example) || []
    }));
    setIsDirty(true);
  };

  // 保存智能体
  const handleSave = async () => {
    if (!agent.name) {
      setErrorMessage('智能体名称不能为空');
      return;
    }

    setLoading(true);
    try {
      // 更新时间戳
      const updatedAgent = {
        ...agent,
        updatedAt: Date.now()
      };

      // 打印保存前的智能体数据，用于调试
      console.log('保存智能体数据:', JSON.stringify(updatedAgent, null, 2));
      
      let savedAgent;
      if (agentId === 'new-agent' || !agentId) {
        savedAgent = await agentService.createAgent(updatedAgent);
      } else {
        savedAgent = await agentService.updateAgent(updatedAgent);
      }
      
      // 打印保存后的结果
      console.log('保存结果:', savedAgent);
      
      if (savedAgent) {
        setAgent(savedAgent);
        setIsDirty(false);
        setErrorMessage(null);
        
        if (onSave) onSave(savedAgent);
      } else {
        setErrorMessage('保存智能体失败，请检查您的网络连接并重试。');
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
      setErrorMessage('保存智能体时发生错误: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 最后保存时间
  const lastSavedTime = agent.updatedAt ? new Date(agent.updatedAt).toLocaleString() : '从未保存';

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* 顶部工具栏 */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">
            {agentId === 'new-agent' || !agentId ? '创建智能体' : '编辑智能体'}
          </h1>
          {agent.updatedAt && (
            <span className="text-xs text-muted-foreground ml-2">
              最后更新: {lastSavedTime}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            取消
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={!isDirty || loading}
          >
            {loading ? (
              <span className="animate-pulse">保存中...</span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 错误消息 */}
      {errorMessage && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* 主要编辑区域 */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-4 w-full flex justify-between">
            <TabsTrigger value="basic" className="flex-1">
              <Info className="h-4 w-4 mr-1" />
              基本信息
            </TabsTrigger>
            <TabsTrigger value="model" className="flex-1">
              <Brain className="h-4 w-4 mr-1" />
              模型配置
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex-1">
              <Wrench className="h-4 w-4 mr-1" />
              工具
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1">
              <Settings className="h-4 w-4 mr-1" />
              高级设置
            </TabsTrigger>
          </TabsList>

          {/* 基本信息内容 */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 左侧：基本信息 */}
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>设置智能体的基本信息和功能介绍</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">名称 *</Label>
                      <Input 
                        id="name" 
                        value={agent.name} 
                        onChange={(e) => updateBasicInfo('name', e.target.value)}
                        placeholder="输入智能体名称"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">描述</Label>
                      <Textarea 
                        id="description" 
                        value={agent.description}
                        onChange={(e) => updateBasicInfo('description', e.target.value)}
                        placeholder="简要描述智能体的功能和用途"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">系统提示词</Label>
                      <Textarea 
                        id="instructions" 
                        value={agent.instructions || ''}
                        onChange={(e) => updateBasicInfo('instructions', e.target.value)}
                        placeholder="设置智能体的行为指导和角色定位"
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="welcomeMessage">欢迎消息</Label>
                      <Textarea 
                        id="welcomeMessage" 
                        value={agent.welcomeMessage || ''}
                        onChange={(e) => updateBasicInfo('welcomeMessage', e.target.value)}
                        placeholder="用户首次使用智能体时显示的欢迎消息"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">智能体类型</Label>
                      <Select 
                        value={agent.type || AgentType.General}
                        onValueChange={(value) => updateBasicInfo('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择智能体类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {agentTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>分类与标签</CardTitle>
                    <CardDescription>添加分类标签以便于用户查找</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {agent.categories?.map(category => (
                          <Badge key={category} variant="secondary" className="flex items-center gap-1">
                            {category}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeCategory(category)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="添加分类标签"
                          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={addCategory}
                          disabled={!newCategory}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="mb-2 block">常用分类</Label>
                      <div className="flex flex-wrap gap-2">
                        {categoryOptions.map(category => (
                          <Badge 
                            key={category} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-secondary"
                            onClick={() => {
                              if (!agent.categories?.includes(category)) {
                                updateBasicInfo('categories', [...(agent.categories || []), category]);
                              }
                            }}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>示例问题</CardTitle>
                    <CardDescription>添加示例问题帮助用户理解智能体功能</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {agent.examples?.map((example, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={example} readOnly />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeExample(example)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <Input 
                          value={newExample}
                          onChange={(e) => setNewExample(e.target.value)}
                          placeholder="添加示例问题"
                          onKeyDown={(e) => e.key === 'Enter' && addExample()}
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={addExample}
                          disabled={!newExample}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右侧：头像和属性 */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>头像</CardTitle>
                    <CardDescription>设置智能体的头像图片</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="text-2xl">
                        {agent.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      上传头像
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>版本与作者</CardTitle>
                    <CardDescription>设置智能体的版本信息和作者</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="version">版本</Label>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input 
                          id="version" 
                          value={agent.version || '1.0.0'} 
                          onChange={(e) => updateBasicInfo('version', e.target.value)}
                          placeholder="1.0.0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">作者</Label>
                      <Input 
                        id="author" 
                        value={agent.author || ''} 
                        onChange={(e) => updateBasicInfo('author', e.target.value)}
                        placeholder="您的名字或组织"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorLink">作者链接</Label>
                      <div className="flex items-center">
                        <Link className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input 
                          id="authorLink" 
                          value={agent.authorLink || ''} 
                          onChange={(e) => updateBasicInfo('authorLink', e.target.value)}
                          placeholder="https://example.com"
                          type="url"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>文档与支持</CardTitle>
                    <CardDescription>添加文档链接和支持信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentationUrl">文档链接</Label>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input 
                          id="documentationUrl" 
                          value={agent.documentationUrl || ''} 
                          onChange={(e) => updateBasicInfo('documentationUrl', e.target.value)}
                          placeholder="https://docs.example.com"
                          type="url"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportContact">支持联系方式</Label>
                      <Input 
                        id="supportContact" 
                        value={agent.supportContact || ''} 
                        onChange={(e) => updateBasicInfo('supportContact', e.target.value)}
                        placeholder="support@example.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 模型配置内容 */}
          <TabsContent value="model" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>语言模型</CardTitle>
                <CardDescription>选择智能体使用的大型语言模型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">模型</Label>
                  <Select 
                    value={agent.model || 'gpt-4-turbo'} 
                    onValueChange={(value) => updateBasicInfo('model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择语言模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="temperature">温度 ({agent.temperature})</Label>
                  </div>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={agent.temperature}
                    onChange={(e) => updateBasicInfo('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>精确</span>
                    <span>平衡</span>
                    <span>创意</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大令牌数</Label>
                  <Input 
                    id="maxTokens" 
                    type="number"
                    value={agent.maxTokens || 4000} 
                    onChange={(e) => updateBasicInfo('maxTokens', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    设置模型生成的最大令牌数量，较大的值可能导致更长的响应和更高的API成本。
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>兼容模型</CardTitle>
                <CardDescription>此智能体兼容的其他模型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {agent.compatibleModels?.map(model => (
                      <Badge key={model} variant="secondary" className="flex items-center gap-1">
                        {model}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            setAgent(prev => ({
                              ...prev,
                              compatibleModels: prev.compatibleModels?.filter(m => m !== model)
                            }));
                            setIsDirty(true);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select 
                      onValueChange={(value) => {
                        if (!agent.compatibleModels?.includes(value)) {
                          setAgent(prev => ({
                            ...prev,
                            compatibleModels: [...(prev.compatibleModels || []), value]
                          }));
                          setIsDirty(true);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="添加兼容模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions
                          .filter(option => option.value !== agent.model && 
                                 !agent.compatibleModels?.includes(option.value))
                          .map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 工具内容 */}
          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>已启用工具</CardTitle>
                <CardDescription>该智能体当前启用的工具</CardDescription>
              </CardHeader>
              <CardContent>
                {agent.tools && agent.tools.length > 0 ? (
                  <div className="space-y-2">
                    {agent.tools.map((tool) => (
                      <div key={tool.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex-1">
                          <h3 className="font-medium">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={tool.enabled}
                            onCheckedChange={(checked) => updateToolStatus(tool.id, checked)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeToolFromAgent(tool.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>没有启用的工具</p>
                    <p className="text-sm">从下方选择工具添加到此智能体</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>添加工具</CardTitle>
                <CardDescription>选择要添加到智能体的工具</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableTools.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex-1">
                        <h3 className="font-medium">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addToolToAgent(tool.id)}
                        disabled={agent.tools?.some(t => t.id === tool.id)}
                      >
                        {agent.tools?.some(t => t.id === tool.id) ? "已添加" : "添加"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 高级设置内容 */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>可见性设置</CardTitle>
                <CardDescription>控制智能体的可见性和推荐状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="public">公开智能体</Label>
                    <p className="text-sm text-muted-foreground">允许其他用户查看和使用此智能体</p>
                  </div>
                  <Switch 
                    id="public"
                    checked={agent.public || false}
                    onCheckedChange={(checked) => updateBasicInfo('public', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured">推荐智能体</Label>
                    <p className="text-sm text-muted-foreground">在智能体市场中作为推荐智能体展示</p>
                  </div>
                  <Switch 
                    id="featured"
                    checked={agent.featured || false}
                    onCheckedChange={(checked) => updateBasicInfo('featured', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>元数据</CardTitle>
                <CardDescription>添加智能体的自定义元数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="license">许可证</Label>
                  <Input 
                    id="license" 
                    value={agent.license || ''} 
                    onChange={(e) => updateBasicInfo('license', e.target.value)}
                    placeholder="MIT, Apache 2.0, GPL, 等"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-destructive">
                <CardTitle>危险区域</CardTitle>
                <CardDescription>这些操作不可逆转，请谨慎操作</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除智能体
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentEditor; 