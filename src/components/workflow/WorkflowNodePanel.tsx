import React from 'react';
import { WorkflowNodeType } from '@/api/WorkflowService';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Bot, 
  Wrench, 
  GitBranch, 
  Box, 
  Code, 
  RefreshCw, 
  Workflow, 
  PanelLeft, 
  PanelRight,
  Text,
  Variable
} from 'lucide-react';

interface WorkflowNodePanelProps {
  onAddNode: (type: string) => void;
}

export default function WorkflowNodePanel({ onAddNode }: WorkflowNodePanelProps) {
  const nodeCategories = [
    {
      name: '基础节点',
      nodes: [
        { 
          type: WorkflowNodeType.START, 
          label: '开始', 
          icon: <Workflow className="h-4 w-4" />,
          description: '工作流的起点'
        },
        { 
          type: WorkflowNodeType.END, 
          label: '结束', 
          icon: <Workflow className="h-4 w-4" />,
          description: '工作流的终点'
        }
      ]
    },
    {
      name: '触发器',
      nodes: [
        { 
          type: 'trigger', 
          label: '触发器', 
          icon: <Zap className="h-4 w-4" />,
          description: '触发工作流执行'
        }
      ]
    },
    {
      name: '数据处理',
      nodes: [
        { 
          type: WorkflowNodeType.INPUT, 
          label: '输入', 
          icon: <PanelLeft className="h-4 w-4" />,
          description: '接收用户输入'
        },
        { 
          type: WorkflowNodeType.OUTPUT, 
          label: '输出', 
          icon: <PanelRight className="h-4 w-4" />,
          description: '产生工作流输出'
        },
        { 
          type: 'variable', 
          label: '变量', 
          icon: <Variable className="h-4 w-4" />,
          description: '定义和存储变量'
        },
        { 
          type: 'string', 
          label: '字符串', 
          icon: <Text className="h-4 w-4" />,
          description: '定义静态字符串值'
        }
      ]
    },
    {
      name: '逻辑控制',
      nodes: [
        { 
          type: WorkflowNodeType.CONDITION, 
          label: '条件', 
          icon: <GitBranch className="h-4 w-4" />,
          description: '根据条件控制工作流'
        },
        { 
          type: WorkflowNodeType.LOOP, 
          label: '循环', 
          icon: <RefreshCw className="h-4 w-4" />,
          description: '重复执行任务'
        }
      ]
    },
    {
      name: 'AI 与执行',
      nodes: [
        { 
          type: WorkflowNodeType.AGENT, 
          label: 'Agent', 
          icon: <Bot className="h-4 w-4" />,
          description: '执行AI智能体'
        },
        { 
          type: 'ai', 
          label: 'AI模型', 
          icon: <Bot className="h-4 w-4" />,
          description: '使用AI大语言模型'
        },
        { 
          type: WorkflowNodeType.TOOL, 
          label: '工具', 
          icon: <Wrench className="h-4 w-4" />,
          description: '调用外部工具'
        },
        { 
          type: 'function', 
          label: '函数', 
          icon: <Code className="h-4 w-4" />,
          description: '执行自定义代码'
        }
      ]
    }
  ];

  return (
    <div className="w-64 border-r p-4 bg-background overflow-y-auto flex-shrink-0">
      <h3 className="text-lg font-medium mb-4">节点面板</h3>
      
      <div className="space-y-6">
        {nodeCategories.map((category, i) => (
          <div key={i}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{category.name}</h4>
            <div className="space-y-1">
              {category.nodes.map((node, j) => (
                <Button
                  key={j}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onAddNode(node.type)}
                  title={node.description}
                >
                  <div className="mr-2">{node.icon}</div>
                  <span>{node.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 