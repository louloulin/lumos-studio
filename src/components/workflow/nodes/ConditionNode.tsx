import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

const ConditionNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-yellow-500 min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-yellow-500"
      />
      <div className="flex items-center">
        <GitBranch className="mr-2 h-5 w-5 text-yellow-500" />
        <div>
          <div className="font-bold">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500">{data.description}</div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-red-500"
      />
    </div>
  );
};

export default memo(ConditionNode); 