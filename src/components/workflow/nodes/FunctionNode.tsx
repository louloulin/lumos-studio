import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Code } from 'lucide-react';

interface FunctionNodeData {
  label: string;
  description?: string;
  inputParams?: {
    name: string;
    type: string;
    required: boolean;
  }[];
  outputParams?: {
    name: string;
    type: string;
  }[];
  code?: string;
}

const FunctionNode = memo(({ data, selected }: NodeProps<FunctionNodeData>) => {
  return (
    <div className={`px-4 py-3 rounded-md shadow-sm border-2 ${selected ? 'border-primary' : 'border-border'} bg-card text-card-foreground w-64`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-md text-green-600 dark:text-green-400">
            <Code size={16} />
          </div>
          <div className="font-medium">{data.label || '函数'}</div>
        </div>
      </div>
      
      {data.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {data.description}
        </div>
      )}
      
      {data.inputParams && data.inputParams.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium">输入:</div>
          <div className="grid grid-cols-1 gap-1 mt-1">
            {data.inputParams.map((param, index) => (
              <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{param.name}</span>
                <span className="text-xs px-1 py-0.5 rounded bg-muted">{param.type}</span>
                {param.required && <span className="text-xs text-red-500">*</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {data.outputParams && data.outputParams.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium">输出:</div>
          <div className="grid grid-cols-1 gap-1 mt-1">
            {data.outputParams.map((param, index) => (
              <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{param.name}</span>
                <span className="text-xs px-1 py-0.5 rounded bg-muted">{param.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500 border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-background"
      />
    </div>
  );
});

FunctionNode.displayName = 'FunctionNode';

export default FunctionNode; 