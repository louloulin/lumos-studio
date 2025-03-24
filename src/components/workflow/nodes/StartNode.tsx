import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

const StartNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-500 min-w-[100px]">
      <div className="flex items-center justify-center">
        <Play className="mr-2 h-5 w-5 text-purple-500" />
        <div className="font-bold">{data.label || '开始'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-purple-500"
      />
    </div>
  );
};

export default memo(StartNode); 