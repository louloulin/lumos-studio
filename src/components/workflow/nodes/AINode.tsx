import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';

interface AINodeData {
  label: string;
  description?: string;
  ai?: {
    provider: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
  };
  prompt?: string;
}

const AINode = memo(({ data, selected }: NodeProps<AINodeData>) => {
  return (
    <div className={`px-4 py-3 rounded-md shadow-sm border-2 ${selected ? 'border-primary' : 'border-border'} bg-card text-card-foreground w-64`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="bg-violet-100 dark:bg-violet-900/30 p-1.5 rounded-md text-violet-600 dark:text-violet-400">
            <Bot size={16} />
          </div>
          <div className="font-medium">{data.label || 'AI节点'}</div>
        </div>
      </div>
      
      {data.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          {data.description}
        </div>
      )}
      
      {data.ai && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">模型:</span>
            <span>{data.ai.provider}/{data.ai.model}</span>
          </div>
          {data.ai.temperature !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-medium">温度:</span>
              <span>{data.ai.temperature}</span>
            </div>
          )}
          {data.ai.systemPrompt && (
            <div className="mt-1">
              <div className="font-medium">系统提示:</div>
              <div className="bg-muted p-1 rounded mt-1 text-xs line-clamp-2">
                {data.ai.systemPrompt}
              </div>
            </div>
          )}
          {data.prompt && (
            <div className="mt-1">
              <div className="font-medium">用户提示:</div>
              <div className="bg-muted p-1 rounded mt-1 text-xs line-clamp-2">
                {data.prompt}
              </div>
            </div>
          )}
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-violet-500 border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-violet-500 border-2 border-background"
      />
    </div>
  );
});

AINode.displayName = 'AINode';

export default AINode; 