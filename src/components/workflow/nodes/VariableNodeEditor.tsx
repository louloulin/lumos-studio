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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { VariableType } from '@/api/WorkflowService';

interface VariableNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    id: string;
    label: string;
    description?: string;
    key?: string;
    variableType?: string;
    value?: any;
  };
  onSave: (data: any) => void;
}

export function VariableNodeEditor({ open, onOpenChange, initialData, onSave }: VariableNodeEditorProps) {
  const [data, setData] = useState({ 
    ...initialData,
    key: initialData.key || `var_${Date.now()}`,
    variableType: initialData.variableType || VariableType.STRING
  });
  
  const handleChange = (field: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = () => {
    onSave(data);
    onOpenChange(false);
  };
  
  const getValueInput = () => {
    const type = data.variableType || VariableType.STRING;
    
    switch (type) {
      case VariableType.BOOLEAN:
        return (
          <Select
            value={data.value?.toString() || 'false'}
            onValueChange={(value) => handleChange('value', value === 'true')}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="选择布尔值" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        );
        
      case VariableType.NUMBER:
        return (
          <Input
            type="number"
            value={data.value?.toString() || '0'}
            onChange={(e) => handleChange('value', Number(e.target.value))}
            className="col-span-3"
          />
        );
        
      case VariableType.OBJECT:
      case VariableType.ARRAY:
        return (
          <Textarea
            value={typeof data.value === 'object' ? JSON.stringify(data.value, null, 2) : data.value || ''}
            onChange={(e) => {
              try {
                const value = JSON.parse(e.target.value);
                handleChange('value', value);
              } catch {
                handleChange('value', e.target.value);
              }
            }}
            className="col-span-3 min-h-[100px] font-mono text-sm"
            placeholder={type === VariableType.OBJECT ? '{ "key": "value" }' : '[ "item1", "item2" ]'}
          />
        );
        
      case VariableType.STRING:
      default:
        return (
          <Input
            value={data.value?.toString() || ''}
            onChange={(e) => handleChange('value', e.target.value)}
            className="col-span-3"
          />
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>配置变量节点</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-name" className="text-right">节点名称</Label>
            <Input
              id="node-name"
              value={data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="var-key" className="text-right">变量键名</Label>
            <Input
              id="var-key"
              value={data.key || ''}
              onChange={(e) => handleChange('key', e.target.value.replace(/\s+/g, '_'))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="var-type" className="text-right">变量类型</Label>
            <Select
              value={data.variableType || VariableType.STRING}
              onValueChange={(value) => handleChange('variableType', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="选择变量类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VariableType.STRING}>字符串</SelectItem>
                <SelectItem value={VariableType.NUMBER}>数字</SelectItem>
                <SelectItem value={VariableType.BOOLEAN}>布尔值</SelectItem>
                <SelectItem value={VariableType.ARRAY}>数组</SelectItem>
                <SelectItem value={VariableType.OBJECT}>对象</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="var-value" className="text-right">默认值</Label>
            {getValueInput()}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-description" className="text-right">描述</Label>
            <Input
              id="node-description"
              value={data.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="col-span-3"
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