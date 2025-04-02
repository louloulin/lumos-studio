import React from 'react';
import { Handle, Position } from 'reactflow';
import { Circle } from 'lucide-react';

interface CircleNodeProps {
  data: {
    name: string;
    type: string;
    onNodeClick?: (id: string) => void;
  };
  id: string;
}

export default function CircleNode({ data, id }: CircleNodeProps) {
  const isStart = data.type === 'START';
  const isEnd = data.type === 'END';
  
  return (
    <div 
      className={`flex flex-col items-center justify-center p-2 rounded-full w-20 h-20 ${
        isStart 
          ? 'bg-green-100 border-2 border-green-500 text-green-700' 
          : 'bg-red-100 border-2 border-red-500 text-red-700'
      }`}
      onClick={() => data.onNodeClick?.(id)}
    >
      {isStart && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2 h-2 bg-green-500"
        />
      )}
      
      {isEnd && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-2 h-2 bg-red-500"
        />
      )}
      
      <Circle className={`w-6 h-6 ${isStart ? 'text-green-600' : 'text-red-600'}`} />
      <div className="text-xs font-medium mt-1 text-center">
        {isStart ? '开始' : '结束'}
      </div>
    </div>
  );
} 