import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';

interface TriggerNodeData {
  label: string;
  description?: string;
  triggerType: string;
  config?: Record<string, any>;
}

const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  return (
    <div className={`px-4 py-3 rounded-md shadow-sm border-2 ${selected ? 'border-primary' : 'border-border'} bg-card text-card-foreground w-64`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded-md text-yellow-600 dark:text-yellow-400">
            <Zap size={16} />
          </div>
          <div className="font-medium">{data.label || '触发器'}</div>
        </div>
      </div>
      
      {data.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {data.description}
        </div>
      )}
      
      <div className="mt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium">类型:</span>
          <span className="px-1.5 py-0.5 rounded bg-muted">{data.triggerType}</span>
        </div>
        
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-1">
            <div className="font-medium">配置:</div>
            <div className="grid grid-cols-1 gap-1 mt-1">
              {Object.entries(data.config).map(([key, value]) => (
                <div key={key} className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{key}:</span>
                  <span className="text-xs truncate max-w-[150px]">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-yellow-500 border-2 border-background"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode; 