import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Text } from 'lucide-react';

interface StringNodeData {
  label: string;
  value: string;
}

const StringNode = memo(({ data, selected }: NodeProps<StringNodeData>) => {
  return (
    <div className={`px-4 py-3 rounded-md shadow-sm border-2 ${selected ? 'border-primary' : 'border-border'} bg-card text-card-foreground w-64`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md text-blue-600 dark:text-blue-400">
            <Text size={16} />
          </div>
          <div className="font-medium">{data.label || '字符串'}</div>
        </div>
      </div>
      
      {data.value && (
        <div className="mt-2 text-sm bg-muted p-2 rounded text-muted-foreground">
          {data.value.length > 50 ? `${data.value.slice(0, 50)}...` : data.value}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-background"
      />
    </div>
  );
});

StringNode.displayName = 'StringNode';

export default StringNode; 