import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HttpRequestNode({ data, id }: NodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  // 获取HTTP配置
  const httpConfig = data.httpConfig || { url: '', method: 'GET' };
  const { url, method } = httpConfig;
  
  // 获取方法对应的样式
  const getMethodStyle = (method: string = 'GET') => {
    const methodStyles: Record<string, string> = {
      'GET': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'POST': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'PUT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'PATCH': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    
    return methodStyles[method] || methodStyles.GET;
  };
  
  // 节点点击处理函数
  const handleNodeClick = () => {
    if (data.onNodeClick) {
      data.onNodeClick(id);
    }
  };
  
  // 折叠切换
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed(!collapsed);
  };
  
  return (
    <div 
      className="relative border-2 border-blue-400 rounded-md p-3 pb-2 bg-white dark:bg-slate-800 shadow-md min-w-[180px]"
      style={{ borderColor: '#3b82f6' }}
      onClick={handleNodeClick}
    >
      {/* 节点标题和操作 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 font-medium text-sm">
          <Globe className="h-4 w-4 text-blue-500" />
          <span>{data.name || 'HTTP请求'}</span>
        </div>
        <button 
          onClick={toggleCollapse}
          className="p-0.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          )}
        </button>
      </div>
      
      {/* 方法和URL */}
      {!collapsed && (
        <>
          <div className="flex gap-2 items-center mt-2 overflow-hidden">
            <Badge 
              variant="outline" 
              className={`${getMethodStyle(method)} font-mono text-xs px-1.5 py-0`}
            >
              {method || 'GET'}
            </Badge>
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {url || 'URL未设置'}
            </div>
          </div>
        </>
      )}
      
      {/* 连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-blue-500 border-2 border-white dark:border-slate-800"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-blue-500 border-2 border-white dark:border-slate-800"
      />
    </div>
  );
} 