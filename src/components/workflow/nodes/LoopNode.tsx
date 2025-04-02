import React from 'react';
import { Handle, Position } from 'reactflow';
import { RefreshCw } from 'lucide-react';

interface LoopNodeProps {
  data: {
    name: string;
    description?: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function LoopNode({ data, id }: LoopNodeProps) {
  return (
    <div 
      className="flex flex-col border-2 border-orange-300 rounded-md bg-orange-50 p-4 min-w-[180px]"
      onClick={() => data.onNodeClick?.(id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-orange-500"
      />
      
      <div className="flex items-center mb-2">
        <RefreshCw className="w-4 h-4 mr-2 text-orange-600" />
        <div className="font-medium text-sm text-orange-800">{data.name}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-orange-600 mt-1">{data.description}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop-body"
        className="w-2 h-2 bg-orange-500 -mb-[5px] -right-[5px]"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop-exit"
        className="w-2 h-2 bg-green-500 -mb-[5px] -left-[5px]"
      />
    </div>
  );
} 