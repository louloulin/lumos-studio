import React from 'react';
import { Handle, Position } from 'reactflow';

interface DefaultNodeProps {
  data: {
    name: string;
    description?: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function DefaultNode({ data, id }: DefaultNodeProps) {
  return (
    <div 
      className="flex flex-col border-2 border-gray-300 rounded-md bg-white p-4 min-w-[180px]"
      onClick={() => data.onNodeClick?.(id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="font-medium text-sm">{data.name}</div>
      {data.description && (
        <div className="text-xs text-gray-500 mt-1">{data.description}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
} 