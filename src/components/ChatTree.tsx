import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  MessageCircle, 
  Plus, 
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { ChatNode } from './ChatService';

// 定义聊天树组件的属性
interface ChatTreeProps {
  sessionId: string;
  treeData: ChatNode | null;
  onSelectNode: (nodeId: string) => void;
  onCreateBranch: (parentNodeId: string) => void;
  onDeleteBranch: (nodeId: string) => void;
  currentNodeId: string;
}

// 递归节点组件
interface NodeComponentProps {
  node: ChatNode;
  level: number;
  isActive: boolean;
  onSelect: (nodeId: string) => void;
  onCreateBranch: (nodeId: string) => void;
  onDeleteBranch: (nodeId: string) => void;
  currentPath: Set<string>;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  level,
  isActive,
  onSelect,
  onCreateBranch,
  onDeleteBranch,
  currentPath
}) => {
  const isOnCurrentPath = currentPath.has(node.id);
  const paddingLeft = `${level * 16}px`;
  
  // 节点文本截断
  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <div className="chat-tree-node">
      <div 
        className={`flex items-center p-2 mb-1 hover:bg-accent/50 rounded-md transition-colors ${
          isActive ? 'bg-accent text-accent-foreground' : (isOnCurrentPath ? 'bg-accent/20' : '')
        }`}
        style={{ paddingLeft }}
        onClick={() => onSelect(node.id)}
      >
        <div className="flex-1 flex items-center space-x-2">
          <span className="flex-shrink-0">
            {node.role === 'user' ? (
              <Badge variant="outline" className="bg-primary/10 text-xs">用户</Badge>
            ) : (
              <Badge variant="outline" className="bg-secondary/10 text-xs">AI</Badge>
            )}
          </span>
          <span className="truncate text-sm">
            {truncateText(node.text)}
          </span>
        </div>
        
        <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateBranch(node.id);
                  }}
                >
                  <Plus size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>从此处创建分支</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {node.parentId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBranch(node.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>删除此分支</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {node.children.length > 0 && (
        <div className="chat-tree-children pl-2">
          {node.children.map(child => (
            <NodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              isActive={isActive && child.id === node.id}
              onSelect={onSelect}
              onCreateBranch={onCreateBranch}
              onDeleteBranch={onDeleteBranch}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 聊天树组件
const ChatTree: React.FC<ChatTreeProps> = ({
  sessionId,
  treeData,
  onSelectNode,
  onCreateBranch,
  onDeleteBranch,
  currentNodeId
}) => {
  // 计算从根节点到当前节点的路径
  const [currentPath, setCurrentPath] = useState<Set<string>>(new Set());

  // 当currentNodeId或树数据变化时，重新计算路径
  useEffect(() => {
    if (!treeData || !currentNodeId) {
      setCurrentPath(new Set());
      return;
    }

    // 查找当前节点到根节点的路径
    const findPathToRoot = (
      node: ChatNode, 
      targetId: string, 
      path: Set<string> = new Set()
    ): boolean => {
      if (node.id === targetId) {
        path.add(node.id);
        return true;
      }

      for (const child of node.children) {
        if (findPathToRoot(child, targetId, path)) {
          path.add(node.id);
          return true;
        }
      }

      return false;
    };

    const newPath = new Set<string>();
    findPathToRoot(treeData, currentNodeId, newPath);
    setCurrentPath(newPath);
  }, [treeData, currentNodeId]);

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
        <div>
          <p>暂无对话数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center">
          <GitBranch className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">对话树</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <NodeComponent
          node={treeData}
          level={0}
          isActive={currentNodeId === treeData.id}
          onSelect={onSelectNode}
          onCreateBranch={onCreateBranch}
          onDeleteBranch={onDeleteBranch}
          currentPath={currentPath}
        />
      </ScrollArea>
    </div>
  );
};

export default ChatTree; 