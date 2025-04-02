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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { TriggerType } from '@/api/WorkflowService';

interface TriggerNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    id: string;
    label: string;
    description?: string;
    triggerType?: string;
    config?: Record<string, any>;
  };
  onSave: (data: any) => void;
}

export function TriggerNodeEditor({ open, onOpenChange, initialData, onSave }: TriggerNodeEditorProps) {
  const [data, setData] = useState({ 
    ...initialData,
    triggerType: initialData.triggerType || TriggerType.MANUAL,
    config: initialData.config || {}
  });
  
  const handleChange = (field: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleConfigChange = (key: string, value: any) => {
    setData((prev) => ({
      ...prev,
      config: {
        ...(prev.config || {}),
        [key]: value
      }
    }));
  };
  
  const handleTriggerTypeChange = (type: string) => {
    // 当触发器类型变更时，重置配置
    let newConfig: Record<string, any> = {};
    
    // 根据不同类型设置默认配置
    switch (type) {
      case TriggerType.SCHEDULED:
        newConfig = {
          cronExpression: '0 0 * * *',
          timezone: 'Asia/Shanghai'
        };
        break;
      case TriggerType.WEBHOOK:
        newConfig = {
          path: `/webhook/${Date.now()}`,
          method: 'POST',
          requireAuth: false
        };
        break;
      case TriggerType.EVENT:
        newConfig = {
          eventType: 'custom.event',
          filter: ''
        };
        break;
      case TriggerType.MESSAGE:
        newConfig = {
          channel: 'default',
          pattern: '.*'
        };
        break;
      default:
        newConfig = {};
    }
    
    setData((prev) => ({
      ...prev,
      triggerType: type,
      config: newConfig
    }));
  };
  
  const renderConfigFields = () => {
    const type = data.triggerType;
    const config = data.config || {};
    
    switch (type) {
      case TriggerType.SCHEDULED:
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cron-expression" className="text-right">Cron表达式</Label>
              <Input
                id="cron-expression"
                value={config.cronExpression || ''}
                onChange={(e) => handleConfigChange('cronExpression', e.target.value)}
                className="col-span-3"
                placeholder="0 0 * * *"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timezone" className="text-right">时区</Label>
              <Input
                id="timezone"
                value={config.timezone || 'Asia/Shanghai'}
                onChange={(e) => handleConfigChange('timezone', e.target.value)}
                className="col-span-3"
                placeholder="Asia/Shanghai"
              />
            </div>
          </>
        );
        
      case TriggerType.WEBHOOK:
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="webhook-path" className="text-right">路径</Label>
              <Input
                id="webhook-path"
                value={config.path || ''}
                onChange={(e) => handleConfigChange('path', e.target.value)}
                className="col-span-3"
                placeholder="/webhook/..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="webhook-method" className="text-right">HTTP方法</Label>
              <Select
                value={config.method || 'POST'}
                onValueChange={(value) => handleConfigChange('method', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择HTTP方法" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="require-auth" className="text-right">需要认证</Label>
              <Select
                value={config.requireAuth?.toString() || 'false'}
                onValueChange={(value) => handleConfigChange('requireAuth', value === 'true')}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="是否需要认证" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case TriggerType.EVENT:
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-type" className="text-right">事件类型</Label>
              <Input
                id="event-type"
                value={config.eventType || ''}
                onChange={(e) => handleConfigChange('eventType', e.target.value)}
                className="col-span-3"
                placeholder="custom.event"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-filter" className="text-right">过滤条件</Label>
              <Input
                id="event-filter"
                value={config.filter || ''}
                onChange={(e) => handleConfigChange('filter', e.target.value)}
                className="col-span-3"
                placeholder="可选的事件过滤条件"
              />
            </div>
          </>
        );
        
      case TriggerType.MESSAGE:
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="msg-channel" className="text-right">消息渠道</Label>
              <Input
                id="msg-channel"
                value={config.channel || ''}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
                className="col-span-3"
                placeholder="default"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="msg-pattern" className="text-right">匹配模式</Label>
              <Input
                id="msg-pattern"
                value={config.pattern || ''}
                onChange={(e) => handleConfigChange('pattern', e.target.value)}
                className="col-span-3"
                placeholder=".*"
              />
            </div>
          </>
        );
        
      default:
        return (
          <div className="text-center text-muted-foreground py-2">
            此触发器类型无需额外配置
          </div>
        );
    }
  };
  
  const handleSubmit = () => {
    onSave(data);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>配置触发器节点</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="node-name" className="text-right">触发器名称</Label>
            <Input
              id="node-name"
              value={data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trigger-type" className="text-right">触发器类型</Label>
            <Select
              value={data.triggerType || TriggerType.MANUAL}
              onValueChange={handleTriggerTypeChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="选择触发器类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TriggerType.MANUAL}>手动触发</SelectItem>
                <SelectItem value={TriggerType.SCHEDULED}>定时触发</SelectItem>
                <SelectItem value={TriggerType.WEBHOOK}>Webhook触发</SelectItem>
                <SelectItem value={TriggerType.EVENT}>事件触发</SelectItem>
                <SelectItem value={TriggerType.MESSAGE}>消息触发</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-medium mb-3">触发器配置</h3>
            {renderConfigFields()}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4 mt-2">
            <Label htmlFor="node-description" className="text-right">触发器描述</Label>
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