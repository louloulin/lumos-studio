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
import { Code, RefreshCw } from 'lucide-react';

// 循环类型
enum LoopType {
  WHILE = 'while',
  UNTIL = 'until',
  FOR_EACH = 'forEach',
  FOR_N_TIMES = 'forNTimes',
  CUSTOM = 'custom'
}

interface LoopNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: any;
  onSave: (data: any) => void;
}

export function LoopNodeEditor({ open, onOpenChange, initialData, onSave }: LoopNodeEditorProps) {
  const [name, setName] = useState(initialData?.name || '循环节点');
  const [description, setDescription] = useState(initialData?.description || '');
  const [loopType, setLoopType] = useState<LoopType>(initialData?.loopConfig?.type || LoopType.WHILE);
  
  // 循环配置
  const [maxIterations, setMaxIterations] = useState(initialData?.loopConfig?.maxIterations?.toString() || '10');
  const [condition, setCondition] = useState(initialData?.loopConfig?.condition || '');
  const [collectionPath, setCollectionPath] = useState(initialData?.loopConfig?.collectionPath || '');
  const [itemName, setItemName] = useState(initialData?.loopConfig?.itemName || 'item');
  const [customLoopCode, setCustomLoopCode] = useState(
    initialData?.functionConfig?.code || 
    'function evaluateLoop(data, context) {\n  // 返回循环是否应该继续\n  return context.iterations < 10;\n}'
  );
  
  const handleSave = () => {
    // 准备保存的节点数据
    const updatedData = {
      ...initialData,
      name,
      description,
      loopConfig: {
        type: loopType,
        maxIterations: parseInt(maxIterations) || 10,
        condition: loopType === LoopType.WHILE || loopType === LoopType.UNTIL ? condition : undefined,
        collectionPath: loopType === LoopType.FOR_EACH ? collectionPath : undefined,
        itemName: loopType === LoopType.FOR_EACH ? itemName : undefined
      },
      functionConfig: {
        code: loopType === LoopType.CUSTOM ? customLoopCode : generateLoopCode(),
        inputParams: [],
        outputParams: [{ name: 'continue', type: 'boolean' }]
      }
    };
    
    onSave(updatedData);
    onOpenChange(false);
  };
  
  // 生成循环代码
  const generateLoopCode = () => {
    switch (loopType) {
      case LoopType.WHILE:
        return `function evaluateLoop(data, context) {
  // 继续循环条件：${condition}
  return ${condition};
}`;
      case LoopType.UNTIL:
        return `function evaluateLoop(data, context) {
  // 结束循环条件：${condition}
  return !(${condition});
}`;
      case LoopType.FOR_EACH:
        return `function evaluateLoop(data, context) {
  const collection = ${collectionPath} || [];
  const currentIndex = context.iterations || 0;
  
  if (currentIndex < collection.length) {
    // 设置当前处理的项
    context.variables['${itemName}'] = collection[currentIndex];
    return true;
  }
  
  return false;
}`;
      case LoopType.FOR_N_TIMES:
        return `function evaluateLoop(data, context) {
  const currentIndex = context.iterations || 0;
  return currentIndex < ${maxIterations};
}`;
      default:
        return customLoopCode;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            编辑循环节点
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
            <Label htmlFor="loop-type" className="text-right">循环类型</Label>
            <Select
              value={loopType}
              onValueChange={(value) => setLoopType(value as LoopType)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="选择循环类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LoopType.WHILE}>当条件为真时循环 (While)</SelectItem>
                <SelectItem value={LoopType.UNTIL}>直到条件为真时停止 (Until)</SelectItem>
                <SelectItem value={LoopType.FOR_EACH}>遍历集合 (For Each)</SelectItem>
                <SelectItem value={LoopType.FOR_N_TIMES}>循环N次 (For N Times)</SelectItem>
                <SelectItem value={LoopType.CUSTOM}>自定义循环 (Custom)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 根据循环类型显示不同配置选项 */}
          {(loopType === LoopType.WHILE || loopType === LoopType.UNTIL) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="condition" className="text-right">
                {loopType === LoopType.WHILE ? '继续条件' : '终止条件'}
              </Label>
              <Input
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="col-span-3"
                placeholder={loopType === LoopType.WHILE 
                  ? 'context.variables.counter < 10' 
                  : 'context.variables.counter >= 10'}
              />
            </div>
          )}
          
          {loopType === LoopType.FOR_EACH && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="collection-path" className="text-right">集合路径</Label>
                <Input
                  id="collection-path"
                  value={collectionPath}
                  onChange={(e) => setCollectionPath(e.target.value)}
                  className="col-span-3"
                  placeholder="context.variables.items"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-name" className="text-right">项变量名</Label>
                <Input
                  id="item-name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="col-span-3"
                  placeholder="item"
                />
              </div>
            </>
          )}
          
          {loopType === LoopType.FOR_N_TIMES && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max-iterations" className="text-right">循环次数</Label>
              <Input
                id="max-iterations"
                type="number"
                value={maxIterations}
                onChange={(e) => setMaxIterations(e.target.value)}
                className="col-span-3"
                min="1"
                max="1000"
              />
            </div>
          )}
          
          {loopType === LoopType.CUSTOM && (
            <div className="space-y-2">
              <Label htmlFor="custom-loop-code" className="block">自定义循环代码</Label>
              <div className="relative">
                <Textarea
                  id="custom-loop-code"
                  value={customLoopCode}
                  onChange={(e) => setCustomLoopCode(e.target.value)}
                  className="h-32 font-mono text-sm"
                />
                <Code className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                编写JavaScript代码来评估循环是否应该继续。函数应该返回布尔值（true表示继续循环）。
              </p>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded border border-gray-200">
            <p className="font-medium mb-1">可用上下文变量:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>context.iterations</code> - 当前循环计数（从0开始）</li>
              <li><code>context.variables</code> - 工作流变量</li>
              <li><code>context.results</code> - 上一步节点结果</li>
            </ul>
          </div>
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