import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Trash } from 'lucide-react';

export interface HttpRequestNodeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: any;
  onSave: (data: any) => void;
}

export function HttpRequestNodeEditor({ open, onOpenChange, initialData, onSave }: HttpRequestNodeEditorProps) {
  const [name, setName] = useState(initialData?.name || 'HTTP请求');
  const [description, setDescription] = useState(initialData?.description || '');
  const [method, setMethod] = useState(initialData?.httpConfig?.method || 'GET');
  const [url, setUrl] = useState(initialData?.httpConfig?.url || '');
  const [body, setBody] = useState(initialData?.httpConfig?.body || '');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>(
    Object.entries(initialData?.httpConfig?.headers || {}).map(([key, value]) => ({ key, value: value as string })) || 
    [{ key: '', value: '' }]
  );
  const [timeout, setTimeout] = useState(initialData?.httpConfig?.timeout?.toString() || '30000');
  const [activeTab, setActiveTab] = useState('general');
  
  // 处理保存
  const handleSave = () => {
    // 准备HTTP配置
    const headersObject: Record<string, string> = {};
    headers.forEach(header => {
      if (header.key && header.value) {
        headersObject[header.key] = header.value;
      }
    });
    
    // 准备更新后的数据
    const updatedData = {
      ...initialData,
      name,
      description,
      httpConfig: {
        method,
        url,
        body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
        headers: Object.keys(headersObject).length > 0 ? headersObject : undefined,
        timeout: timeout ? parseInt(timeout) : undefined
      }
    };
    
    onSave(updatedData);
    onOpenChange(false);
  };
  
  // 添加新的header
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };
  
  // 移除header
  const removeHeader = (index: number) => {
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
  };
  
  // 更新header
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            编辑HTTP请求节点
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="general">常规配置</TabsTrigger>
            <TabsTrigger value="headers">请求头</TabsTrigger>
            <TabsTrigger value="body">请求体</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">节点名称</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="输入节点名称"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="输入节点描述"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="method">请求方法</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="请求方法" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">请求URL</Label>
              <Input 
                id="url" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://example.com/api/data"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeout">超时时间 (毫秒)</Label>
              <Input 
                id="timeout" 
                type="number" 
                value={timeout} 
                onChange={(e) => setTimeout(e.target.value)} 
                placeholder="30000"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="headers" className="space-y-4">
            <div className="space-y-4">
              <Label className="block mb-2">请求头</Label>
              
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    value={header.key} 
                    onChange={(e) => updateHeader(index, 'key', e.target.value)} 
                    placeholder="Header名称"
                    className="flex-1"
                  />
                  <Input 
                    value={header.value} 
                    onChange={(e) => updateHeader(index, 'value', e.target.value)} 
                    placeholder="Header值"
                    className="flex-1"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeHeader(index)}
                    className="h-8 w-8"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addHeader}
              >
                添加请求头
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="body" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="body">请求体</Label>
              <Textarea 
                id="body" 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder={method === 'POST' || method === 'PUT' || method === 'PATCH' 
                  ? '输入请求体内容 (如JSON字符串)' 
                  : 'GET请求通常不包含请求体'}
                rows={10}
                disabled={method === 'GET' || method === 'HEAD'}
              />
              {(method === 'GET' || method === 'HEAD') && (
                <p className="text-sm text-muted-foreground">
                  {method} 请求通常不包含请求体
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 