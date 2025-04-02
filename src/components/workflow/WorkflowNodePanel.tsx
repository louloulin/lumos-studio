import React, { useState } from 'react';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { 
  PlusCircle, 
  Code, 
  Variable, 
  Bot, 
  FileText, 
  MessageSquare, 
  Zap, 
  Webhook, 
  Settings, 
  Database,
  Square,
  Search,
  ArrowRightLeft
} from 'lucide-react';
import { WorkflowNodeType } from '@/api/WorkflowService';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// 定义面板分类
interface NodeCategory {
  id: string;
  name: string;
  items: NodeTypeDefinition[];
}

// 定义节点类型
interface NodeTypeDefinition {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// 定义组件属性
interface WorkflowNodePanelProps {
  onAddNode?: (type: string) => void;
}

// 可拖拽节点组件
const DraggableNode: React.FC<{ nodeType: NodeTypeDefinition; onAddNode?: (type: string) => void }> = ({ nodeType, onAddNode }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'node',
    item: { type: nodeType.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  return (
    <div 
      ref={drag}
      className={`flex items-center p-3 my-1 rounded-md border cursor-grab transition-all 
                ${isDragging ? 'opacity-50 border-dashed' : 'hover:bg-accent hover:border-primary'}`}
      style={{ borderColor: isDragging ? nodeType.color : 'transparent' }}
      onClick={() => onAddNode && onAddNode(nodeType.type)}
    >
      <div className="p-2 rounded-md mr-3" style={{ backgroundColor: `${nodeType.color}20`, color: nodeType.color }}>
        {nodeType.icon}
      </div>
      <div>
        <div className="font-medium text-sm">{nodeType.title}</div>
        <div className="text-xs text-muted-foreground">{nodeType.description}</div>
      </div>
    </div>
  );
};

// 节点类型定义
const nodeTypes: Record<string, NodeCategory> = {
  basic: {
    id: 'basic',
    name: '基础节点',
    items: [
      {
        type: WorkflowNodeType.AI,
        title: 'AI节点',
        description: '使用大语言模型生成内容',
        icon: <Bot size={18} />,
        color: '#0ea5e9',
      },
      {
        type: WorkflowNodeType.FUNCTION,
        title: '函数节点',
        description: '执行自定义JavaScript代码',
        icon: <Code size={18} />,
        color: '#8b5cf6',
      },
      {
        type: WorkflowNodeType.VARIABLE,
        title: '变量节点',
        description: '定义和操作工作流变量',
        icon: <Variable size={18} />,
        color: '#f59e0b',
      },
      {
        type: 'string',
        title: '文本节点',
        description: '处理和操作文本内容',
        icon: <FileText size={18} />,
        color: '#10b981',
      }
    ]
  },
  advanced: {
    id: 'advanced',
    name: '高级节点',
    items: [
      {
        type: WorkflowNodeType.CONDITION,
        title: '条件节点',
        description: '根据条件控制工作流执行路径',
        icon: <ArrowRightLeft size={18} />,
        color: '#ec4899',
      },
      {
        type: WorkflowNodeType.LOOP,
        title: '循环节点',
        description: '循环处理数据或重复执行操作',
        icon: <Zap size={18} />,
        color: '#14b8a6',
      },
      {
        type: WorkflowNodeType.KNOWLEDGE,
        title: '知识库节点',
        description: '使用向量数据库查询相关内容',
        icon: <Database size={18} />,
        color: '#6366f1',
      },
      {
        type: WorkflowNodeType.WEBHOOK,
        title: 'Webhook节点',
        description: '发送或接收HTTP请求',
        icon: <Webhook size={18} />,
        color: '#f43f5e',
      },
    ]
  },
  trigger: {
    id: 'trigger',
    name: '触发器',
    items: [
      {
        type: 'trigger',
        title: '触发器节点',
        description: '定义工作流的触发条件',
        icon: <Zap size={18} />,
        color: '#0284c7',
      },
      {
        type: 'message_trigger',
        title: '消息触发',
        description: '接收消息时触发工作流',
        icon: <MessageSquare size={18} />,
        color: '#db2777',
      },
      {
        type: 'schedule_trigger',
        title: '定时触发',
        description: '按计划自动执行工作流',
        icon: <Settings size={18} />,
        color: '#4f46e5',
      },
      {
        type: 'api_trigger',
        title: 'API触发',
        description: '提供API接口触发工作流',
        icon: <Code size={18} />,
        color: '#0891b2',
      }
    ]
  },
  tools: {
    id: 'tools',
    name: '工具节点',
    items: [
      {
        type: WorkflowNodeType.TOOL,
        title: '通用工具',
        description: '使用已安装的工具扩展功能',
        icon: <Settings size={18} />,
        color: '#7c3aed',
      },
      {
        type: 'http_tool',
        title: 'HTTP请求',
        description: '发送HTTP请求并处理响应',
        icon: <Webhook size={18} />,
        color: '#059669',
      },
      {
        type: 'search_tool',
        title: '搜索工具',
        description: '使用搜索引擎获取信息',
        icon: <Search size={18} />,
        color: '#d946ef',
      },
      {
        type: 'database_tool',
        title: '数据库操作',
        description: '连接和操作数据库',
        icon: <Database size={18} />,
        color: '#0d9488',
      }
    ]
  }
};

export function WorkflowNodePanel({ onAddNode }: WorkflowNodePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('basic');
  
  // 搜索节点
  const searchNodes = () => {
    if (!searchTerm.trim()) return null;
    
    const matchedNodes: NodeTypeDefinition[] = [];
    
    Object.values(nodeTypes).forEach(category => {
      category.items.forEach(node => {
        if (
          node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedNodes.push(node);
        }
      });
    });
    
    if (matchedNodes.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          未找到匹配的节点
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        {matchedNodes.map((node) => (
          <DraggableNode key={node.type} nodeType={node} onAddNode={onAddNode} />
        ))}
      </div>
    );
  };
  
  const renderNodeCategory = (categoryId: string) => {
    const category = nodeTypes[categoryId];
    if (!category) return null;
    
    return (
      <div className="space-y-1">
        {category.items.map((nodeType) => (
          <DraggableNode key={nodeType.type} nodeType={nodeType} onAddNode={onAddNode} />
        ))}
      </div>
    );
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">节点面板</h3>
          <p className="text-sm text-muted-foreground">
            拖拽节点添加到工作流
          </p>
          <div className="mt-2">
            <Input 
              placeholder="搜索节点..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {searchTerm ? (
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="pb-4">
              <h4 className="font-medium text-sm mb-2">搜索结果</h4>
              {searchNodes()}
            </div>
          </ScrollArea>
        ) : (
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
            <TabsList className="px-4 pt-2 justify-start border-b rounded-none">
              {Object.values(nodeTypes).map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.keys(nodeTypes).map((categoryId) => (
              <TabsContent 
                key={categoryId} 
                value={categoryId} 
                className="flex-1 overflow-auto px-4 py-2 m-0"
              >
                <ScrollArea className="h-full">
                  {renderNodeCategory(categoryId)}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
        
        <div className="p-3 border-t">
          <button className="w-full text-xs text-center flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground">
            <PlusCircle size={14} />
            创建自定义节点
          </button>
        </div>
      </div>
    </DndProvider>
  );
} 