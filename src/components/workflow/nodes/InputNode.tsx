import React from 'react';
import { Handle, Position } from 'reactflow';
import { PanelLeft } from 'lucide-react';

interface InputNodeProps {
  data: {
    name: string;
    description?: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function InputNode({ data, id }: InputNodeProps) {
  return (
    <div 
      className="flex flex-col border-2 border-cyan-300 rounded-md bg-cyan-50 p-4 min-w-[180px]"
      onClick={() => data.onNodeClick?.(id)}
    >
      <div className="flex items-center mb-2">
        <PanelLeft className="w-4 h-4 mr-2 text-cyan-600" />
        <div className="font-medium text-sm text-cyan-800">{data.name}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-cyan-600 mt-1">{data.description}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-cyan-500"
      />
    </div>
  );
} 