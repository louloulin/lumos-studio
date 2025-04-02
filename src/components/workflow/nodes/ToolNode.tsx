import React from 'react';
import { Handle, Position } from 'reactflow';
import { Wrench } from 'lucide-react';

interface ToolNodeProps {
  data: {
    name: string;
    description?: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function ToolNode({ data, id }: ToolNodeProps) {
  return (
    <div 
      className="flex flex-col border-2 border-blue-300 rounded-md bg-blue-50 p-4 min-w-[180px]"
      onClick={() => data.onNodeClick?.(id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-blue-500"
      />
      
      <div className="flex items-center mb-2">
        <Wrench className="w-4 h-4 mr-2 text-blue-600" />
        <div className="font-medium text-sm text-blue-800">{data.name}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-blue-600 mt-1">{data.description}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
} 