import React from 'react';
import { Handle, Position } from 'reactflow';
import { PanelRight } from 'lucide-react';

interface OutputNodeProps {
  data: {
    name: string;
    description?: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function OutputNode({ data, id }: OutputNodeProps) {
  return (
    <div 
      className="flex flex-col border-2 border-emerald-300 rounded-md bg-emerald-50 p-4 min-w-[180px]"
      onClick={() => data.onNodeClick?.(id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-emerald-500"
      />
      
      <div className="flex items-center mb-2">
        <PanelRight className="w-4 h-4 mr-2 text-emerald-600" />
        <div className="font-medium text-sm text-emerald-800">{data.name}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-emerald-600 mt-1">{data.description}</div>
      )}
    </div>
  );
} 