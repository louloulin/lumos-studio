import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';

const AgentNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500 min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
      <div className="flex items-center">
        <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />
        <div>
          <div className="font-bold">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500">{data.description}</div>
          )}
          {data.agentId && (
            <div className="text-xs mt-1 text-blue-500">ID: {data.agentId}</div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
};

export default memo(AgentNode); 