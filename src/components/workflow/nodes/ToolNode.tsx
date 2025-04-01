import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Tool } from '@/api/ToolService';
import { Wrench } from 'lucide-react';

interface ToolNodeData {
  label: string;
  description?: string;
  toolId?: string;
  params?: Record<string, any>;
}

const ToolNode = memo(({ data, selected }: NodeProps<ToolNodeData>) => {
  return (
    <div className={`px-4 py-3 rounded-md shadow-sm border-2 ${selected ? 'border-primary' : 'border-border'} bg-card text-card-foreground w-64`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-md text-primary">
            <Wrench size={16} />
          </div>
          <div className="font-medium">{data.label || '工具节点'}</div>
        </div>
      </div>
      
      {data.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {data.description}
        </div>
      )}
      
      {data.toolId && (
        <div className="mt-2 text-xs text-muted-foreground">
          工具ID: {data.toolId}
        </div>
      )}
      
      {data.params && Object.keys(data.params).length > 0 && (
        <div className="mt-2 text-xs border-t pt-2">
          <div className="font-medium mb-1">参数:</div>
          <ul className="space-y-1">
            {Object.entries(data.params).map(([key, value]) => (
              <li key={key}>
                <span className="font-medium">{key}</span>: {String(value)}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </div>
  );
});

ToolNode.displayName = 'ToolNode';

export default ToolNode; 