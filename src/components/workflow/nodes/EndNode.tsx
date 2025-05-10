import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Square } from 'lucide-react';

const EndNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-red-500 min-w-[100px]">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-red-500"
      />
      <div className="flex items-center justify-center">
        <Square className="mr-2 h-5 w-5 text-red-500" />
        <div className="font-bold">{data.label || '结束'}</div>
      </div>
    </div>
  );
};

export default memo(EndNode); 