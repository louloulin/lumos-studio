import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface ConditionNodeProps {
  data: {
    name: string;
    description?: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function ConditionNode({ data, id }: ConditionNodeProps) {
  return (
    <div 
      className="flex flex-col border-2 border-yellow-300 rounded-md bg-yellow-50 p-4 min-w-[180px]"
      onClick={() => data.onNodeClick?.(id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-yellow-500"
      />
      
      <div className="flex items-center mb-2">
        <GitBranch className="w-4 h-4 mr-2 text-yellow-600" />
        <div className="font-medium text-sm text-yellow-800">{data.name}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-yellow-600 mt-1">{data.description}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-2 h-2 bg-green-500 -mb-[5px] -right-[5px]"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-2 h-2 bg-red-500 -mb-[5px] -left-[5px]"
      />
    </div>
  );
} 