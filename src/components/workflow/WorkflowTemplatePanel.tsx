import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { workflowService, Workflow } from '@/api/WorkflowService';
import { 
  SearchIcon, 
  PlusCircle, 
  MessageSquare, 
  Database, 
  Globe,
  Bot, 
  Calendar, 
  FileText, 
  Zap, 
  Copy, 
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

// 模板类型定义
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: React.ReactNode;
  color: string;
  template: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;
}

// 工作流模板
const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'chatbot',
    name: '对话机器人',
    description: '创建一个基于AI的对话机器人，可以回答用户问题',
    category: '对话应用',
    tags: ['AI', '聊天', '客服'],
    icon: <MessageSquare size={20} />,
    color: '#0ea5e9',
    template: {
      name: '对话机器人',
      description: '基础AI对话机器人',
      nodes: [],
      edges: [],
      isPublic: false,
      author: '',
      tags: ['AI', '聊天', '客服']
    }
  },
  {
    id: 'rag',
    name: '知识库查询',
    description: '基于向量数据库的RAG检索增强生成系统',
    category: '知识库',
    tags: ['RAG', '知识库', '检索'],
    icon: <Database size={20} />,
    color: '#8b5cf6',
    template: {
      name: '知识库查询',
      description: '基于向量数据库的RAG检索增强生成系统',
      nodes: [],
      edges: [],
      isPublic: false,
      author: '',
      tags: ['RAG', '知识库', '检索']
    }
  },
  {
    id: 'web-crawler',
    name: '网页爬虫',
    description: '爬取网页内容并进行处理',
    category: '数据处理',
    tags: ['爬虫', '网页', '数据'],
    icon: <Globe size={20} />,
    color: '#ec4899',
    template: {
      name: '网页爬虫',
      description: '爬取网页内容并进行处理',
      nodes: [],
      edges: [],
      isPublic: false,
      author: '',
      tags: ['爬虫', '网页', '数据']
    }
  },
  {
    id: 'agent',
    name: 'AI助手',
    description: '实现一个具有工具使用能力的AI助手',
    category: 'AI助手',
    tags: ['Agent', '工具', '助手'],
    icon: <Bot size={20} />,
    color: '#10b981',
    template: {
      name: 'AI助手',
      description: '实现一个具有工具使用能力的AI助手',
      nodes: [],
      edges: [],
      isPublic: false,
      author: '',
      tags: ['Agent', '工具', '助手']
    }
  },
  {
    id: 'scheduled-task',
    name: '定时任务',
    description: '创建一个定时执行的自动化工作流',
    category: '自动化',
    tags: ['定时', '自动化', '任务'],
    icon: <Calendar size={20} />,
    color: '#f59e0b',
    template: {
      name: '定时任务',
      description: '创建一个定时执行的自动化工作流',
      nodes: [],
      edges: [],
      isPublic: false,
      author: '',
      tags: ['定时', '自动化', '任务']
    }
  },
  {
    id: 'data-processor',
    name: '数据处理',
    description: '处理和转换各种格式的数据',
    category: '数据处理',
    tags: ['数据', '转换', '处理'],
    icon: <FileText size={20} />,
    color: '#6366f1',
    template: {
      name: '数据处理',
      description: '处理和转换各种格式的数据',
      nodes: [],
      edges: [],
      isPublic: false,
      author: '',
      tags: ['数据', '转换', '处理']
    }
  },
  {
    id: 'webhook-handler',
    name: 'Webhook处理',
    description: '接收和处理webhook请求',
    category: '集成',
    tags: ['webhook', 'API', '集成'],
    icon: <Zap size={20} />,
    color: '#0891b2',
    template: {
      name: 'Webhook处理',
      description: '接收和处理webhook请求',
      nodes: [],
      edges: [],
      isPublic: false,
      author: '',
      tags: ['webhook', 'API', '集成']
    }
  }
];

const categories = [
  '全部',
  ...Array.from(new Set(workflowTemplates.map(template => template.category)))
];

interface WorkflowTemplatePanelProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
  onCreateWorkflow: (workflow: Workflow) => void;
}

export function WorkflowTemplatePanel({ onSelectTemplate, onCreateWorkflow }: WorkflowTemplatePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  
  // 筛选模板
  const filterTemplates = () => {
    return workflowTemplates.filter(template => {
      // 根据搜索词筛选
      const matchesSearch = 
        searchTerm === '' || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 根据分类筛选
      const matchesCategory = 
        selectedCategory === '全部' || 
        template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };
  
  // 创建工作流
  const handleCreateFromTemplate = (template: WorkflowTemplate) => {
    const newWorkflow = workflowService.createWorkflow(template.template);
    onCreateWorkflow(newWorkflow);
  };
  
  const filteredTemplates = filterTemplates();
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">工作流模板</h3>
        <p className="text-sm text-muted-foreground">
          选择预设模板快速创建工作流
        </p>
        
        <div className="relative mt-2">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索模板..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 gap-4 p-4">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-2" 
                        style={{ backgroundColor: `${template.color}20`, color: template.color }}
                      >
                        {template.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{template.category}</CardDescription>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => onSelectTemplate(template)}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>查看详情</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    使用此模板
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <SearchIcon className="h-12 w-12 mb-4 opacity-20" />
              <p>未找到匹配的模板</p>
              <p className="text-sm mt-1">尝试使用不同的搜索词或筛选条件</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 