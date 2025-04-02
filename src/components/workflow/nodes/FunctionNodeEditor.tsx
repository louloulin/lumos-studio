import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash, ArrowDownUp } from 'lucide-react';

interface ParamConfig {
  name: string;
  type: string;
  required: boolean;
}

interface FunctionNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    id: string;
    label: string;
    description?: string;
    code?: string;
    inputParams?: ParamConfig[];
    outputParams?: {name: string; type: string}[];
  };
  onSave: (data: any) => void;
}

export function FunctionNodeEditor({ open, onOpenChange, initialData, onSave }: FunctionNodeEditorProps) {
  const [data, setData] = useState({ 
    ...initialData,
    inputParams: initialData.inputParams || [],
    outputParams: initialData.outputParams || [],
    code: initialData.code || `// 编写函数代码\nreturn {\n  success: true,\n  result: "执行成功"\n};`
  });
  
  const handleChange = (field: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAddInputParam = () => {
    setData((prev) => ({
      ...prev,
      inputParams: [
        ...prev.inputParams || [],
        { name: `param${(prev.inputParams?.length || 0) + 1}`, type: 'string', required: false }
      ]
    }));
  };
  
  const handleUpdateInputParam = (index: number, field: keyof ParamConfig, value: any) => {
    setData((prev) => {
      const newParams = [...(prev.inputParams || [])];
      newParams[index] = { ...newParams[index], [field]: value };
      return { ...prev, inputParams: newParams };
    });
  };
  
  const handleRemoveInputParam = (index: number) => {
    setData((prev) => {
      const newParams = [...(prev.inputParams || [])];
      newParams.splice(index, 1);
      return { ...prev, inputParams: newParams };
    });
  };
  
  const handleMoveInputParam = (index: number, direction: 'up' | 'down') => {
    if (!data.inputParams || data.inputParams.length <= 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.inputParams.length) return;
    
    setData((prev) => {
      const newParams = [...(prev.inputParams || [])];
      const temp = newParams[index];
      newParams[index] = newParams[newIndex];
      newParams[newIndex] = temp;
      return { ...prev, inputParams: newParams };
    });
  };
  
  const handleAddOutputParam = () => {
    setData((prev) => ({
      ...prev,
      outputParams: [
        ...prev.outputParams || [],
        { name: `result${(prev.outputParams?.length || 0) + 1}`, type: 'string' }
      ]
    }));
  };
  
  const handleUpdateOutputParam = (index: number, field: 'name' | 'type', value: string) => {
    setData((prev) => {
      const newParams = [...(prev.outputParams || [])];
      newParams[index] = { ...newParams[index], [field]: value };
      return { ...prev, outputParams: newParams };
    });
  };
  
  const handleRemoveOutputParam = (index: number) => {
    setData((prev) => {
      const newParams = [...(prev.outputParams || [])];
      newParams.splice(index, 1);
      return { ...prev, outputParams: newParams };
    });
  };
  
  const handleSubmit = () => {
    onSave(data);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>配置函数节点</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-name" className="text-right">函数名称</Label>
            <Input
              id="node-name"
              value={data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-description" className="text-right">函数描述</Label>
            <Input
              id="node-description"
              value={data.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="text-right">
              <Label>输入参数</Label>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-2"
                onClick={handleAddInputParam}
              >
                <Plus size={14} />
              </Button>
            </div>
            <div className="col-span-3 border rounded-md p-2">
              {data.inputParams && data.inputParams.length > 0 ? (
                <div className="space-y-2">
                  {data.inputParams.map((param, index) => (
                    <div key={index} className="flex items-center gap-2 p-1 hover:bg-muted rounded-sm">
                      <Input
                        value={param.name}
                        onChange={(e) => handleUpdateInputParam(index, 'name', e.target.value)}
                        placeholder="参数名"
                        className="w-1/3"
                      />
                      <select
                        value={param.type}
                        onChange={(e) => handleUpdateInputParam(index, 'type', e.target.value)}
                        className="border rounded-md p-2 w-1/3 text-sm"
                      >
                        <option value="string">字符串</option>
                        <option value="number">数字</option>
                        <option value="boolean">布尔值</option>
                        <option value="object">对象</option>
                        <option value="array">数组</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={param.required}
                          onChange={(e) => handleUpdateInputParam(index, 'required', e.target.checked)}
                          className="mr-1"
                        />
                        <Label htmlFor={`required-${index}`} className="text-xs">必填</Label>
                      </div>
                      <div className="flex items-center ml-auto">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleMoveInputParam(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowDownUp size={14} className="rotate-180" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleMoveInputParam(index, 'down')}
                          disabled={index === data.inputParams.length - 1}
                        >
                          <ArrowDownUp size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleRemoveInputParam(index)}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-2 text-sm">
                  点击 + 添加参数
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="text-right">
              <Label>输出参数</Label>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-2"
                onClick={handleAddOutputParam}
              >
                <Plus size={14} />
              </Button>
            </div>
            <div className="col-span-3 border rounded-md p-2">
              {data.outputParams && data.outputParams.length > 0 ? (
                <div className="space-y-2">
                  {data.outputParams.map((param, index) => (
                    <div key={index} className="flex items-center gap-2 p-1 hover:bg-muted rounded-sm">
                      <Input
                        value={param.name}
                        onChange={(e) => handleUpdateOutputParam(index, 'name', e.target.value)}
                        placeholder="参数名"
                        className="w-1/2"
                      />
                      <select
                        value={param.type}
                        onChange={(e) => handleUpdateOutputParam(index, 'type', e.target.value)}
                        className="border rounded-md p-2 w-1/2 text-sm"
                      >
                        <option value="string">字符串</option>
                        <option value="number">数字</option>
                        <option value="boolean">布尔值</option>
                        <option value="object">对象</option>
                        <option value="array">数组</option>
                      </select>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive ml-auto"
                        onClick={() => handleRemoveOutputParam(index)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-2 text-sm">
                  点击 + 添加输出参数
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="function-code" className="text-right pt-2">函数代码</Label>
            <Textarea
              id="function-code"
              value={data.code || ''}
              onChange={(e) => handleChange('code', e.target.value)}
              className="col-span-3 min-h-[200px] font-mono text-sm"
              placeholder="// 编写函数代码"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 