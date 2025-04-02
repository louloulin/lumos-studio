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
import { Slider } from '@/components/ui/slider';

interface AINodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    id: string;
    label: string;
    description?: string;
    aiConfig?: {
      model?: string;
      prompt?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  onSave: (data: any) => void;
}

export function AINodeEditor({ open, onOpenChange, initialData, onSave }: AINodeEditorProps) {
  const [data, setData] = useState({
    ...initialData,
    aiConfig: {
      model: initialData.aiConfig?.model || 'gpt-3.5-turbo',
      prompt: initialData.aiConfig?.prompt || '',
      temperature: initialData.aiConfig?.temperature || 0.7,
      maxTokens: initialData.aiConfig?.maxTokens || 1000
    }
  });
  
  const handleChange = (field: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAIConfigChange = (field: string, value: any) => {
    setData((prev) => ({
      ...prev,
      aiConfig: {
        ...(prev.aiConfig || {}),
        [field]: value
      }
    }));
  };
  
  const handleSubmit = () => {
    onSave(data);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>配置AI节点</DialogTitle>
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
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-model" className="text-right">AI模型</Label>
            <Select
              value={data.aiConfig?.model || 'gpt-3.5-turbo'}
              onValueChange={(value) => handleAIConfigChange('model', value)}
            >
              <SelectTrigger id="ai-model" className="col-span-3">
                <SelectValue placeholder="选择AI模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="ai-prompt" className="text-right pt-2">提示词</Label>
            <Textarea
              id="ai-prompt"
              value={data.aiConfig?.prompt || ''}
              onChange={(e) => handleAIConfigChange('prompt', e.target.value)}
              className="col-span-3 min-h-[100px]"
              placeholder="输入提示词..."
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-temperature" className="text-right">温度 ({data.aiConfig?.temperature || 0.7})</Label>
            <div className="col-span-3 px-1">
              <Slider
                id="ai-temperature"
                value={[data.aiConfig?.temperature || 0.7]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(value) => handleAIConfigChange('temperature', value[0])}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ai-max-tokens" className="text-right">最大Token数</Label>
            <Input
              id="ai-max-tokens"
              type="number"
              min={1}
              max={8000}
              value={data.aiConfig?.maxTokens || 1000}
              onChange={(e) => handleAIConfigChange('maxTokens', parseInt(e.target.value))}
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