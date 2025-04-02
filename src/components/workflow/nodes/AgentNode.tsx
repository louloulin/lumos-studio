import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot } from 'lucide-react';

interface AgentNodeProps {
  data: {
    name: string;
    description?: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function AgentNode({ data, id }: AgentNodeProps) {
  return (
    <div 
      className="flex flex-col border-2 border-purple-300 rounded-md bg-purple-50 p-4 min-w-[180px]"
      onClick={() => data.onNodeClick?.(id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-purple-500"
      />
      
      <div className="flex items-center mb-2">
        <Bot className="w-4 h-4 mr-2 text-purple-600" />
        <div className="font-medium text-sm text-purple-800">{data.name}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-purple-600 mt-1">{data.description}</div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-purple-500"
      />
    </div>
  );
} 