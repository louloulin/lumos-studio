import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Variable } from 'lucide-react';

interface VariableNodeData {
  label: string;
  variableType: string;
  key: string;
  value?: any;
  description?: string;
}

const VariableNode = memo(({ data, selected }: NodeProps<VariableNodeData>) => {
  return (
    <div className={`px-4 py-3 rounded-md shadow-sm border-2 ${selected ? 'border-primary' : 'border-border'} bg-card text-card-foreground w-64`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-md text-purple-600 dark:text-purple-400">
            <Variable size={16} />
          </div>
          <div className="font-medium">{data.label || '变量'}</div>
        </div>
      </div>
      
      {data.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {data.description}
        </div>
      )}
      
      <div className="mt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium">键:</span>
          <span className="px-1.5 py-0.5 rounded bg-muted">{data.key}</span>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="font-medium">类型:</span>
          <span className="px-1.5 py-0.5 rounded bg-muted">{data.variableType}</span>
        </div>
        
        {data.value !== undefined && (
          <div className="mt-1">
            <div className="font-medium">默认值:</div>
            <div className="bg-muted p-1.5 rounded mt-1 text-xs line-clamp-2">
              {typeof data.value === 'object' 
                ? JSON.stringify(data.value).slice(0, 50) + (JSON.stringify(data.value).length > 50 ? '...' : '')
                : String(data.value)}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-background"
      />
    </div>
  );
});

VariableNode.displayName = 'VariableNode';

export default VariableNode; 