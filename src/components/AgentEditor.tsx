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
import { Agent, AgentTool } from '@/api/types';
import { agentService, getBuiltinTools } from '@/api/AgentService';

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

// 默认智能体配置
const defaultAgent: Agent = {
  id: 'new-agent',
  name: '新建智能体',
  description: '这是一个新建的智能体，您可以根据需要自定义它的行为和功能。',
  instructions: '你是一个有用的AI助手，专注于提供准确和有帮助的回答。请始终保持友好和专业的态度。',
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 4000,
  tools: getBuiltinTools(),
  systemAgent: false
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
    const fetchAgent = async () => {
      if (agentId && agentId !== 'new-agent') {
        setLoading(true);
        try {
          const loadedAgent = await agentService.getAgent(agentId);
          if (loadedAgent) {
            // 确保Agent有所有必要字段
            setAgent({
              ...defaultAgent,
              ...loadedAgent,
            });
          }
        } catch (error) {
          console.error('Failed to load agent:', error);
          setErrorMessage('加载智能体数据时出错，请重试。');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchAgent();
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

  // 保存智能体
  const saveAgent = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // 创建或更新智能体
      let savedAgent: Agent | null;
      
      if (agentId === 'new-agent' || !agentId) {
        // 创建新智能体
        savedAgent = await agentService.createAgent(agent);
      } else {
        // 更新现有智能体
        savedAgent = await agentService.updateAgent(agent);
      }
      
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
            {loading ? (
              <span className="animate-pulse">保存中...</span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
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
                    placeholder="简要描述此智能体的功能和用途"
                    rows={3}
                  />
                </div>
                {/* 头像上传功能可以在这里添加 */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 模型和参数配置 */}
        <Card>
          <CardHeader>
            <CardTitle>模型和参数</CardTitle>
            <CardDescription>选择语言模型和生成参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="agent-model">模型</Label>
              <Select
                value={agent.model}
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
              <p className="text-sm text-muted-foreground">
                选择底层语言模型将决定智能体的能力和成本
              </p>
            </div>

            <div>
              <Label className="mb-2 block">温度 ({agent.temperature})</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm">0.0</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agent.temperature}
                  onChange={(e) => updateBasicInfo('temperature', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm">1.0</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                较低的值使输出更确定，较高的值使输出更多样化
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-instructions">系统指令</Label>
              <Textarea
                id="agent-instructions"
                value={agent.instructions || ''}
                onChange={(e) => updateBasicInfo('instructions', e.target.value)}
                placeholder="给智能体的详细指令..."
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                系统指令定义智能体的行为、能力和限制
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 工具集成 */}
        <Card>
          <CardHeader>
            <CardTitle>工具集成</CardTitle>
            <CardDescription>启用智能体可以使用的工具</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agent.tools && agent.tools.map(tool => (
                <div key={tool.id} className="flex items-start space-x-3 p-3 border rounded-md">
                  <Checkbox
                    id={`tool-${tool.id}`}
                    checked={!!tool.enabled}
                    onCheckedChange={(checked) => updateToolStatus(tool.id, !!checked)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`tool-${tool.id}`}
                      className="text-base font-medium cursor-pointer"
                    >
                      {tool.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentEditor; 