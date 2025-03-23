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
  Upload, Image, Info, Settings, AlertCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';

// 定义工具接口
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  enabled: boolean;
  configOptions?: any;
}

// 定义智能体接口
interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  instructions: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: Tool[];
  knowledge: {
    enabled: boolean;
    sources: string[];
  };
  welcome: string;
  multimodal: boolean;
}

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

// 示例工具列表
const availableTools: Tool[] = [
  {
    id: 'web-search',
    name: '网络搜索',
    description: '从互联网搜索最新信息',
    category: '网络',
    icon: <Wrench className="h-4 w-4" />,
    enabled: true
  },
  {
    id: 'weather-api',
    name: '天气查询',
    description: '获取实时天气数据',
    category: 'API',
    icon: <Wrench className="h-4 w-4" />,
    enabled: false
  },
  {
    id: 'code-interpreter',
    name: '代码执行',
    description: '分析数据和执行代码',
    category: '开发',
    icon: <Wrench className="h-4 w-4" />,
    enabled: false
  },
  {
    id: 'calculator',
    name: '计算器',
    description: '执行数学计算',
    category: '工具',
    icon: <Wrench className="h-4 w-4" />,
    enabled: true
  },
  {
    id: 'dalle',
    name: 'DALL-E',
    description: '生成图像',
    category: '创意',
    icon: <Image className="h-4 w-4" />,
    enabled: false
  },
  {
    id: 'file-reader',
    name: '文件读取',
    description: '读取和分析各种格式的文件',
    category: '文档',
    icon: <Database className="h-4 w-4" />,
    enabled: false
  }
];

// 默认智能体配置
const defaultAgent: Agent = {
  id: 'new-agent',
  name: '新建智能体',
  description: '这是一个新建的智能体，您可以根据需要自定义它的行为和功能。',
  instructions: '你是一个有用的AI助手，专注于提供准确和有帮助的回答。请始终保持友好和专业的态度。',
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 4000,
  tools: availableTools,
  knowledge: {
    enabled: false,
    sources: []
  },
  welcome: '你好！我是你的AI助手，有什么我可以帮助你的吗？',
  multimodal: true
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

  // 加载智能体数据
  useEffect(() => {
    if (agentId && agentId !== 'new-agent') {
      setLoading(true);
      // 这里应该是API调用，目前模拟
      setTimeout(() => {
        setAgent(defaultAgent);
        setLoading(false);
      }, 500);
    }
  }, [agentId]);

  // 更新基本信息
  const updateBasicInfo = (field: keyof Agent, value: any) => {
    setAgent(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // 更新工具状态
  const updateToolStatus = (toolId: string, enabled: boolean) => {
    setAgent(prev => ({
      ...prev,
      tools: prev.tools.map(tool => 
        tool.id === toolId ? { ...tool, enabled } : tool
      )
    }));
    setIsDirty(true);
  };

  // 保存智能体
  const saveAgent = async () => {
    setLoading(true);
    try {
      // 这里应该调用API保存智能体
      console.log('Saving agent:', agent);
      setTimeout(() => {
        setLoading(false);
        setIsDirty(false);
        if (onSave) onSave(agent);
      }, 800);
    } catch (error) {
      setLoading(false);
      setErrorMessage('保存智能体时出错，请稍后重试。');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* 顶部工具栏 */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">
            {agentId === 'new-agent' ? '创建智能体' : '编辑智能体'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            取消
          </Button>
          <Button 
            size="sm" 
            onClick={saveAgent} 
            disabled={!isDirty || loading}
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-6 space-y-6">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* 基本信息区 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>配置智能体的基本信息和外观</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                {agent.avatar ? (
                  <AvatarImage src={agent.avatar} alt={agent.name} />
                ) : null}
                <AvatarFallback className="text-lg">
                  {agent.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="grid gap-2">
                  <Label htmlFor="agent-name">名称</Label>
                  <Input
                    id="agent-name"
                    value={agent.name}
                    onChange={(e) => updateBasicInfo('name', e.target.value)}
                    placeholder="输入智能体名称"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="agent-description">描述</Label>
                  <Textarea
                    id="agent-description"
                    value={agent.description}
                    onChange={(e) => updateBasicInfo('description', e.target.value)}
                    placeholder="描述这个智能体的功能和用途"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-welcome">欢迎消息</Label>
              <Input
                id="agent-welcome"
                value={agent.welcome}
                onChange={(e) => updateBasicInfo('welcome', e.target.value)}
                placeholder="智能体向用户打招呼的第一条消息"
              />
            </div>
          </CardContent>
        </Card>

        {/* 选项卡区域 */}
        <Tabs defaultValue="instructions" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="instructions" className="flex gap-1 items-center">
              <MessageSquare className="h-4 w-4" />
              <span>指令</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="flex gap-1 items-center">
              <Brain className="h-4 w-4" />
              <span>模型</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex gap-1 items-center">
              <Wrench className="h-4 w-4" />
              <span>工具</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex gap-1 items-center">
              <Database className="h-4 w-4" />
              <span>知识库</span>
            </TabsTrigger>
          </TabsList>

          {/* 指令选项卡 */}
          <TabsContent value="instructions">
            <Card>
              <CardHeader>
                <CardTitle>系统指令</CardTitle>
                <CardDescription>定义智能体的行为、个性和能力</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>提示</AlertTitle>
                    <AlertDescription>
                      详细的系统指令可以让智能体更好地理解它的角色和任务。
                    </AlertDescription>
                  </Alert>
                  <Textarea
                    value={agent.instructions}
                    onChange={(e) => updateBasicInfo('instructions', e.target.value)}
                    placeholder="输入系统指令..."
                    rows={12}
                    className="font-mono"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  使用模板
                </Button>
                <Button variant="outline" size="sm">
                  验证
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* 模型选项卡 */}
          <TabsContent value="model">
            <Card>
              <CardHeader>
                <CardTitle>模型配置</CardTitle>
                <CardDescription>选择和配置大语言模型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="model-select">大语言模型</Label>
                  <Select
                    value={agent.model}
                    onValueChange={(value) => updateBasicInfo('model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择大语言模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="temperature">温度 ({agent.temperature})</Label>
                    <span className="text-xs text-muted-foreground">
                      {agent.temperature < 0.3 ? '更保守' : agent.temperature > 0.7 ? '更创意' : '平衡'}
                    </span>
                  </div>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={agent.temperature}
                    onChange={(e) => updateBasicInfo('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>精确</span>
                    <span>创意</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="max-tokens">最大输出</Label>
                    <span className="text-xs text-muted-foreground">
                      {agent.maxTokens} tokens
                    </span>
                  </div>
                  <input
                    id="max-tokens"
                    type="range"
                    min="1000"
                    max="8000"
                    step="1000"
                    value={agent.maxTokens}
                    onChange={(e) => updateBasicInfo('maxTokens', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="multimodal">多模态</Label>
                    <p className="text-sm text-muted-foreground">
                      允许智能体处理图像和文本
                    </p>
                  </div>
                  <Switch
                    id="multimodal"
                    checked={agent.multimodal}
                    onCheckedChange={(checked) => updateBasicInfo('multimodal', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 工具选项卡 */}
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>工具配置</CardTitle>
                <CardDescription>选择智能体可以使用的工具</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agent.tools.map((tool) => (
                    <div key={tool.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center">
                          {tool.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{tool.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {tool.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={tool.enabled}
                        onCheckedChange={(checked) => updateToolStatus(tool.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  配置工具参数
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* 知识库选项卡 */}
          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <CardTitle>知识库配置</CardTitle>
                <CardDescription>上传文档以提高智能体的知识量</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="knowledge-base">启用知识库</Label>
                    <p className="text-sm text-muted-foreground">
                      允许智能体访问自定义知识
                    </p>
                  </div>
                  <Switch
                    id="knowledge-base"
                    checked={agent.knowledge.enabled}
                    onCheckedChange={(checked) => 
                      setAgent(prev => ({
                        ...prev,
                        knowledge: {
                          ...prev.knowledge,
                          enabled: checked
                        }
                      }))
                    }
                  />
                </div>

                {agent.knowledge.enabled && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 rounded-lg border border-dashed border-border p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="text-sm font-medium">拖放文档或点击上传</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        支持PDF、TXT、DOCX、MD等格式，最大50MB
                      </p>
                      <Button variant="secondary" size="sm" className="mt-4">
                        选择文件
                      </Button>
                    </div>

                    {agent.knowledge.sources.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">尚未上传任何知识源</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                          已上传知识源 ({agent.knowledge.sources.length})
                        </h3>
                        <div className="space-y-1">
                          {agent.knowledge.sources.map((source, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                              <div className="text-sm truncate">{source}</div>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentEditor; 