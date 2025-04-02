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

interface StringNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    id: string;
    label: string;
    description?: string;
    value?: string;
  };
  onSave: (data: any) => void;
}

export function StringNodeEditor({ open, onOpenChange, initialData, onSave }: StringNodeEditorProps) {
  const [data, setData] = useState({ ...initialData });
  
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>配置字符串节点</DialogTitle>
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
            <Label htmlFor="node-description" className="text-right">节点描述</Label>
            <Input
              id="node-description"
              value={data.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="string-value" className="text-right pt-2">字符串值</Label>
            <Textarea
              id="string-value"
              value={data.value || ''}
              onChange={(e) => handleChange('value', e.target.value)}
              className="col-span-3 min-h-[100px]"
              placeholder="输入字符串值..."
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