import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Code, GitBranch } from 'lucide-react';

// 条件类型
enum ConditionType {
  SIMPLE = 'simple',
  CODE = 'code'
}

// 简单条件操作符
enum SimpleOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals'
}

interface ConditionNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: any;
  onSave: (data: any) => void;
}

export function ConditionNodeEditor({ open, onOpenChange, initialData, onSave }: ConditionNodeEditorProps) {
  const [name, setName] = useState(initialData?.name || '条件节点');
  const [description, setDescription] = useState(initialData?.description || '');
  const [conditionType, setConditionType] = useState<ConditionType>(
    initialData?.conditionConfig?.type || ConditionType.SIMPLE
  );
  
  // 简单条件配置
  const [leftOperand, setLeftOperand] = useState(initialData?.conditionConfig?.leftOperand || '');
  const [operator, setOperator] = useState(initialData?.conditionConfig?.operator || SimpleOperator.EQUALS);
  const [rightOperand, setRightOperand] = useState(initialData?.conditionConfig?.rightOperand || '');
  
  // 代码条件配置
  const [conditionCode, setConditionCode] = useState(
    initialData?.functionConfig?.code || 
    'function evaluateCondition(data, context) {\n  // 返回布尔值\n  return true;\n}'
  );
  
  const handleSave = () => {
    // 准备保存的节点数据
    const updatedData = {
      ...initialData,
      name,
      description,
      conditionConfig: {
        type: conditionType,
        leftOperand: conditionType === ConditionType.SIMPLE ? leftOperand : undefined,
        operator: conditionType === ConditionType.SIMPLE ? operator : undefined,
        rightOperand: conditionType === ConditionType.SIMPLE ? rightOperand : undefined
      },
      functionConfig: {
        code: conditionType === ConditionType.CODE ? conditionCode : 
          conditionType === ConditionType.SIMPLE ? 
          generateConditionCode(leftOperand, operator, rightOperand) : '',
        inputParams: [],
        outputParams: [{ name: 'result', type: 'boolean' }]
      }
    };
    
    onSave(updatedData);
    onOpenChange(false);
  };
  
  // 简单条件转换为代码
  const generateConditionCode = (left: string, op: SimpleOperator, right: string) => {
    let comparison = '';
    
    switch (op) {
      case SimpleOperator.EQUALS:
        comparison = `${left} === ${right}`;
        break;
      case SimpleOperator.NOT_EQUALS:
        comparison = `${left} !== ${right}`;
        break;
      case SimpleOperator.CONTAINS:
        comparison = `String(${left}).includes(String(${right}))`;
        break;
      case SimpleOperator.NOT_CONTAINS:
        comparison = `!String(${left}).includes(String(${right}))`;
        break;
      case SimpleOperator.GREATER_THAN:
        comparison = `Number(${left}) > Number(${right})`;
        break;
      case SimpleOperator.LESS_THAN:
        comparison = `Number(${left}) < Number(${right})`;
        break;
      case SimpleOperator.GREATER_THAN_OR_EQUALS:
        comparison = `Number(${left}) >= Number(${right})`;
        break;
      case SimpleOperator.LESS_THAN_OR_EQUALS:
        comparison = `Number(${left}) <= Number(${right})`;
        break;
      default:
        comparison = `${left} === ${right}`;
    }
    
    return `function evaluateCondition(data, context) {\n  return ${comparison};\n}`;
  };
  
  // 运算符显示名称
  const getOperatorName = (op: SimpleOperator) => {
    switch (op) {
      case SimpleOperator.EQUALS: return '等于';
      case SimpleOperator.NOT_EQUALS: return '不等于';
      case SimpleOperator.CONTAINS: return '包含';
      case SimpleOperator.NOT_CONTAINS: return '不包含';
      case SimpleOperator.GREATER_THAN: return '大于';
      case SimpleOperator.LESS_THAN: return '小于';
      case SimpleOperator.GREATER_THAN_OR_EQUALS: return '大于等于';
      case SimpleOperator.LESS_THAN_OR_EQUALS: return '小于等于';
      default: return '等于';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-yellow-500" />
            编辑条件节点
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">描述</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="condition-type" className="text-right">条件类型</Label>
            <Select
              value={conditionType}
              onValueChange={(value) => setConditionType(value as ConditionType)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="选择条件类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ConditionType.SIMPLE}>简单条件</SelectItem>
                <SelectItem value={ConditionType.CODE}>代码条件</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {conditionType === ConditionType.SIMPLE ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="left-operand" className="text-right">左操作数</Label>
                <Input
                  id="left-operand"
                  value={leftOperand}
                  onChange={(e) => setLeftOperand(e.target.value)}
                  className="col-span-3"
                  placeholder="context.variables.value"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="operator" className="text-right">运算符</Label>
                <Select
                  value={operator}
                  onValueChange={(value) => setOperator(value as SimpleOperator)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择运算符" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SimpleOperator).map((op) => (
                      <SelectItem key={op} value={op}>
                        {getOperatorName(op as SimpleOperator)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="right-operand" className="text-right">右操作数</Label>
                <Input
                  id="right-operand"
                  value={rightOperand}
                  onChange={(e) => setRightOperand(e.target.value)}
                  className="col-span-3"
                  placeholder="10"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="condition-code" className="block">条件代码</Label>
              <div className="relative">
                <Textarea
                  id="condition-code"
                  value={conditionCode}
                  onChange={(e) => setConditionCode(e.target.value)}
                  className="h-32 font-mono text-sm"
                />
                <Code className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                编写JavaScript代码来评估条件。函数应该返回布尔值（true/false）。
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 