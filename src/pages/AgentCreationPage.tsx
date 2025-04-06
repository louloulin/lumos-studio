import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, ChevronRight, Plus, Search, Filter, Bot, Check, Brain, 
  Zap, Download, FileCode, Settings
} from 'lucide-react';
import AgentEditor from '@/components/AgentEditor';
import { Agent, AgentType } from '@/api/types';
import { agentService } from '@/api/AgentService';

// 创建过程步骤
enum CreationStep {
  SelectTemplate = 'template',
  BasicInfo = 'basic',
  Advanced = 'advanced',
  Review = 'review'
}

// 模板类型
interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: AgentType;
  avatar?: string;
  tags: string[];
  instruction: string;
  tools?: string[];
}

// 示例模板
const agentTemplates: AgentTemplate[] = [
  {
    id: 'agent',
    name: '通用助手',
    description: '一个通用型AI助手，可以回答各种问题，提供帮助和建议。',
    category: '基础',
    type: AgentType.General,
    avatar: '/templates/general.png',
    tags: ['通用', '助手', '问答'],
    instruction: '你是一个有用的AI助手，专注于提供准确和有帮助的回答。请始终保持友好和专业的态度。'
  },
  {
    id: 'coding-assistant',
    name: '编程助手',
    description: '专注于代码开发的智能体，可以帮助编写、解释和调试代码。',
    category: '开发',
    type: AgentType.Coding,
    avatar: '/templates/coding.png',
    tags: ['编程', '开发', '调试'],
    instruction: '你是一个专业的编程助手，擅长编写、解释和调试代码。你应该提供清晰、易于理解的代码示例，并解释代码的工作原理。优先考虑代码的可读性、效率和最佳实践。'
  },
  {
    id: 'creative-writer',
    name: '创意写作',
    description: '帮助创作文章、小说、诗歌等创意内容，提供写作灵感和建议。',
    category: '创意',
    type: AgentType.Writing,
    avatar: '/templates/writer.png',
    tags: ['写作', '创意', '内容创作'],
    instruction: '你是一个富有创造力的写作助手，可以帮助用户创作各种文字内容，包括但不限于文章、小说、诗歌、剧本等。你应该提供有创意的建议、修改意见，以及帮助用户克服写作障碍。'
  },
  {
    id: 'research-assistant',
    name: '研究助手',
    description: '帮助进行学术研究、文献综述和数据分析，提供引用格式化。',
    category: '学术',
    type: AgentType.Research,
    avatar: '/templates/research.png',
    tags: ['研究', '学术', '分析'],
    instruction: '你是一个学术研究助手，擅长帮助用户进行研究工作，包括文献综述、研究方法设计、数据分析等。你应该提供有根据的信息，尊重学术规范，并在必要时提供适当的引用格式。'
  },
  {
    id: 'data-analyst',
    name: '数据分析师',
    description: '专注于数据处理和分析，提供数据可视化建议和解释。',
    category: '数据',
    type: AgentType.Data,
    avatar: '/templates/data.png',
    tags: ['数据', '分析', '可视化'],
    instruction: '你是一个专业的数据分析师，擅长处理和分析各类数据，并提供有价值的见解。你应该能够解释复杂的数据概念，推荐合适的分析方法和可视化技术，并帮助用户理解数据背后的故事。'
  },
  {
    id: 'custom',
    name: '自定义智能体',
    description: '从头开始创建自定义智能体，完全按照您的需求进行配置。',
    category: '定制',
    type: AgentType.Custom,
    avatar: '/templates/custom.png',
    tags: ['自定义', '定制', '灵活'],
    instruction: ''
  }
];

// 智能体创建页面组件
const AgentCreationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态
  const [currentStep, setCurrentStep] = useState<CreationStep>(CreationStep.SelectTemplate);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [newAgent, setNewAgent] = useState<Agent>({
    id: `agent-${Date.now()}`,
    name: '',
    description: '',
    instructions: '',
    type: AgentType.General,
    model: 'gpt-4-turbo',
    categories: [],
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 当选择模板时更新新智能体信息
  useEffect(() => {
    if (selectedTemplate) {
      setNewAgent(prev => ({
        ...prev,
        name: selectedTemplate.name !== '自定义智能体' ? selectedTemplate.name : '',
        description: selectedTemplate.name !== '自定义智能体' ? selectedTemplate.description : '',
        instructions: selectedTemplate.instruction,
        type: selectedTemplate.type,
        categories: selectedTemplate.tags,
        avatar: selectedTemplate.avatar
      }));
    }
  }, [selectedTemplate]);

  // 过滤模板
  const filteredTemplates = searchQuery 
    ? agentTemplates.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : agentTemplates;

  // 选择模板
  const handleSelectTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(CreationStep.BasicInfo);
  };

  // 更新基本信息
  const handleBasicInfoChange = (field: keyof Agent, value: any) => {
    setNewAgent(prev => ({ ...prev, [field]: value }));
  };

  // 返回上一步
  const handleBack = () => {
    switch (currentStep) {
      case CreationStep.BasicInfo:
        setCurrentStep(CreationStep.SelectTemplate);
        break;
      case CreationStep.Advanced:
        setCurrentStep(CreationStep.BasicInfo);
        break;
      case CreationStep.Review:
        setCurrentStep(CreationStep.Advanced);
        break;
      default:
        navigate('/agents');
    }
  };

  // 前进到下一步
  const handleNext = () => {
    switch (currentStep) {
      case CreationStep.BasicInfo:
        setCurrentStep(CreationStep.Advanced);
        break;
      case CreationStep.Advanced:
        setCurrentStep(CreationStep.Review);
        break;
      default:
        // Do nothing
    }
  };

  // 完成创建
  const handleComplete = async () => {
    try {
      // 保存新智能体
      const savedAgent = await agentService.createAgent(newAgent);
      console.log('Created agent:', savedAgent);
      
      // 跳转到智能体页面
      navigate('/agents');
    } catch (error) {
      console.error('Failed to create agent:', error);
      // 处理错误
    }
  };

  // 渲染模板选择步骤
  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">选择模板</h1>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          取消
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="搜索模板..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSelectTemplate(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={template.avatar} />
                  <AvatarFallback>
                    {template.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary">{template.category}</Badge>
                    {template.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="secondary" className="w-full">
                选择此模板
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // 渲染基本信息步骤
  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">基本信息</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            返回
          </Button>
          <Button onClick={handleNext}>
            下一步
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>智能体信息</CardTitle>
              <CardDescription>设置智能体的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input 
                  id="name" 
                  value={newAgent.name} 
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  placeholder="输入智能体名称"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea 
                  id="description" 
                  value={newAgent.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  placeholder="描述这个智能体的功能和用途"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">指令提示词</Label>
                <Textarea 
                  id="instructions" 
                  value={newAgent.instructions || ''}
                  onChange={(e) => handleBasicInfoChange('instructions', e.target.value)}
                  placeholder="设置智能体的行为指南和角色定位"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  这是一段指导智能体行为的文本，定义了它的角色、知识范围和回应方式。
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>分类与标签</CardTitle>
              <CardDescription>添加分类便于日后查找</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>选择分类</Label>
                <div className="flex flex-wrap gap-2">
                  {['工具', '创意', '开发', '学术', '商业', '生活', '教育', '翻译', '写作', '数据分析'].map(category => (
                    <Badge 
                      key={category} 
                      variant={newAgent.categories?.includes(category) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const categories = newAgent.categories || [];
                        if (categories.includes(category)) {
                          handleBasicInfoChange('categories', categories.filter(c => c !== category));
                        } else {
                          handleBasicInfoChange('categories', [...categories, category]);
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
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>头像</CardTitle>
              <CardDescription>设置智能体的图像</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={newAgent.avatar} alt={newAgent.name} />
                <AvatarFallback className="text-2xl">
                  {newAgent.name ? newAgent.name.substring(0, 2) : 'AI'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" className="w-full">
                上传头像
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>类型与版本</CardTitle>
              <CardDescription>设置智能体的类型和版本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">智能体类型</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(AgentType).map(([key, value]) => (
                    <Badge 
                      key={value} 
                      variant={newAgent.type === value ? 'default' : 'outline'}
                      className="cursor-pointer py-2 flex justify-center"
                      onClick={() => handleBasicInfoChange('type', value)}
                    >
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version">版本</Label>
                <Input 
                  id="version" 
                  value={newAgent.version || '1.0.0'} 
                  onChange={(e) => handleBasicInfoChange('version', e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // 渲染高级设置步骤
  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">高级设置</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            返回
          </Button>
          <Button onClick={handleNext}>
            下一步
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>模型设置</CardTitle>
              <CardDescription>配置智能体使用的语言模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">选择模型</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet', 'gemini-pro'].map(model => (
                    <Badge 
                      key={model} 
                      variant={newAgent.model === model ? 'default' : 'outline'}
                      className="cursor-pointer py-2 flex justify-center"
                      onClick={() => handleBasicInfoChange('model', model)}
                    >
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">温度 ({newAgent.temperature || 0.7})</Label>
                </div>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={newAgent.temperature || 0.7}
                  onChange={(e) => handleBasicInfoChange('temperature', parseFloat(e.target.value))}
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
                  value={newAgent.maxTokens || 4000} 
                  onChange={(e) => handleBasicInfoChange('maxTokens', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>示例问题</CardTitle>
              <CardDescription>添加示例问题帮助用户理解智能体功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(newAgent.examples || []).map((example, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={example} readOnly />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const examples = [...(newAgent.examples || [])];
                        examples.splice(index, 1);
                        handleBasicInfoChange('examples', examples);
                      }}
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="添加示例问题"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const examples = [...(newAgent.examples || []), e.currentTarget.value];
                        handleBasicInfoChange('examples', examples);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="添加示例问题"]') as HTMLInputElement;
                      if (input && input.value) {
                        const examples = [...(newAgent.examples || []), input.value];
                        handleBasicInfoChange('examples', examples);
                        input.value = '';
                      }
                    }}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>可见性设置</CardTitle>
              <CardDescription>控制智能体的可见性</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public">公开智能体</Label>
                  <p className="text-sm text-muted-foreground">允许其他用户查看和使用此智能体</p>
                </div>
                <input
                  type="checkbox"
                  id="public"
                  checked={newAgent.public || false}
                  onChange={(e) => handleBasicInfoChange('public', e.target.checked)}
                  className="toggle"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>元数据</CardTitle>
              <CardDescription>添加智能体的其他信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author">作者</Label>
                <Input 
                  id="author" 
                  value={newAgent.author || ''} 
                  onChange={(e) => handleBasicInfoChange('author', e.target.value)}
                  placeholder="您的名字或组织"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="authorLink">作者链接</Label>
                <Input 
                  id="authorLink" 
                  value={newAgent.authorLink || ''} 
                  onChange={(e) => handleBasicInfoChange('authorLink', e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // 渲染审核步骤
  const renderReview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">审核与创建</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            返回
          </Button>
          <Button onClick={handleComplete}>
            创建智能体
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>智能体摘要</CardTitle>
              <CardDescription>确认智能体配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={newAgent.avatar} alt={newAgent.name} />
                  <AvatarFallback className="text-2xl">
                    {newAgent.name ? newAgent.name.substring(0, 2) : 'AI'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{newAgent.name}</h2>
                  <p className="text-muted-foreground">{newAgent.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary">{newAgent.type}</Badge>
                    {newAgent.categories?.map(category => (
                      <Badge key={category} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div>
                  <h3 className="font-medium">系统提示词:</h3>
                  <p className="text-sm border p-2 rounded bg-secondary/20 whitespace-pre-wrap">
                    {newAgent.instructions}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">模型配置:</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge>{newAgent.model}</Badge>
                    <Badge>温度: {newAgent.temperature || 0.7}</Badge>
                    <Badge>最大令牌: {newAgent.maxTokens || 4000}</Badge>
                  </div>
                </div>
                
                {newAgent.examples && newAgent.examples.length > 0 && (
                  <div>
                    <h3 className="font-medium">示例问题:</h3>
                    <ul className="list-disc list-inside text-sm">
                      {newAgent.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>创建后的操作</CardTitle>
              <CardDescription>智能体创建完成后可以执行的操作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>开始与智能体对话</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>编辑智能体配置</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>添加更多工具和能力</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>导出或分享智能体</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>提示与建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>👉 丰富的系统提示词可以让智能体表现得更好</p>
              <p>👉 添加示例问题帮助用户更好地使用智能体</p>
              <p>👉 创建后您随时可以修改智能体的配置</p>
              <p>👉 为智能体添加工具可以扩展其功能</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // 根据当前步骤渲染不同内容
  const renderCurrentStep = () => {
    switch (currentStep) {
      case CreationStep.SelectTemplate:
        return renderTemplateSelection();
      case CreationStep.BasicInfo:
        return renderBasicInfo();
      case CreationStep.Advanced:
        return renderAdvancedSettings();
      case CreationStep.Review:
        return renderReview();
      default:
        return renderTemplateSelection();
    }
  };
  
  // 步骤进度指示器
  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {Object.values(CreationStep).map((step, index) => (
          <div 
            key={step} 
            className={`flex flex-col items-center ${index < Object.values(CreationStep).indexOf(currentStep) ? 'text-primary' : (index === Object.values(CreationStep).indexOf(currentStep) ? 'text-primary' : 'text-muted-foreground')}`}
          >
            <div className={`rounded-full w-8 h-8 flex items-center justify-center 
              ${index < Object.values(CreationStep).indexOf(currentStep) ? 
                'bg-primary text-primary-foreground' : 
                (index === Object.values(CreationStep).indexOf(currentStep) ? 
                  'bg-primary text-primary-foreground' : 
                  'bg-muted text-muted-foreground')}
            `}>
              {index < Object.values(CreationStep).indexOf(currentStep) ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-xs mt-1 capitalize">
              {step === 'template' ? '选择模板' : 
               step === 'basic' ? '基本信息' : 
               step === 'advanced' ? '高级设置' : '审核'}
            </span>
          </div>
        ))}
      </div>
      <div className="relative mt-2">
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-full">
          <div 
            className="h-1 bg-primary rounded-full" 
            style={{ 
              width: `${(Object.values(CreationStep).indexOf(currentStep) / (Object.values(CreationStep).length - 1)) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-6">
      {renderStepIndicator()}
      {renderCurrentStep()}
    </div>
  );
};

export default AgentCreationPage; 