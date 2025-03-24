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

// 定义对话节点类型
interface ChatNode {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  children: ChatNode[];
  parentId: string | null;
}

// 定义聊天树组件的属性
interface ChatTreeProps {
  sessionId: string;
  onSelectNode: (nodeId: string) => void;
  onCreateBranch: (parentNodeId: string) => void;
  onDeleteBranch: (nodeId: string) => void;
  currentNodeId: string;
}

// 聊天树组件
const ChatTree: React.FC<ChatTreeProps> = ({
  sessionId,
  onSelectNode,
  onCreateBranch,
  onDeleteBranch,
  currentNodeId
}) => {
  // 对话树数据
  const [treeData, setTreeData] = useState<ChatNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 模拟从API获取对话树数据
  useEffect(() => {
    const fetchChatTree = async () => {
      try {
        setLoading(true);
        // 这里应当替换为实际的API调用，用于获取对话树数据
        // const response = await apiService.getChatTree(sessionId);
        
        // 示例数据
        const mockTreeData: ChatNode = {
          id: 'root',
          text: '开始对话',
          role: 'assistant',
          timestamp: new Date(),
          children: [
            {
              id: 'user1',
              text: '你好，我想了解一下智能体的使用方法',
              role: 'user',
              timestamp: new Date(Date.now() - 1000 * 60 * 10),
              children: [
                {
                  id: 'assistant1',
                  text: '您好！智能体是一种自动化程序，可以根据您的指令完成特定任务。使用方法包括：1. 选择合适的智能体类型 2. 配置智能体参数 3. 通过对话或特定指令与智能体交互。有什么具体的智能体您想了解吗？',
                  role: 'assistant',
                  timestamp: new Date(Date.now() - 1000 * 60 * 9),
                  children: [
                    {
                      id: 'user2',
                      text: '我想了解一下网络搜索工具的使用',
                      role: 'user',
                      timestamp: new Date(Date.now() - 1000 * 60 * 8),
                      children: [
                        {
                          id: 'assistant2',
                          text: '网络搜索工具允许智能体在对话中检索实时网络信息。使用方法：\n1. 确保您的智能体配置中启用了网络搜索工具\n2. 直接询问需要网络搜索的问题，如"最近的全球新闻是什么？"\n3. 智能体会自动检测需要搜索的内容并执行搜索\n\n您可以在智能体编辑器中的"工具配置"部分启用或禁用此功能。',
                          role: 'assistant',
                          timestamp: new Date(Date.now() - 1000 * 60 * 7),
                          children: [],
                          parentId: 'user2'
                        }
                      ],
                      parentId: 'assistant1'
                    },
                    {
                      id: 'user3',
                      text: '我想知道怎么创建自定义智能体',
                      role: 'user',
                      timestamp: new Date(Date.now() - 1000 * 60 * 6),
                      children: [
                        {
                          id: 'assistant3',
                          text: '创建自定义智能体的步骤：\n\n1. 打开智能体编辑器：点击侧边栏的"智能体编辑器"按钮\n\n2. 基本配置：\n   - 设置智能体名称和描述\n   - 选择基础模型（如GPT-4、Claude等）\n   - 编写系统提示词，定义智能体的行为和能力\n\n3. 工具配置：\n   - 选择智能体可使用的工具，如网络搜索、文件处理等\n   - 配置各工具的参数\n\n4. 高级设置：\n   - 设置温度等参数调整智能体输出的创造性\n   - 配置记忆功能\n\n5. 保存智能体：点击保存按钮完成创建\n\n创建后，您可以通过新建会话选择您的自定义智能体进行对话。',
                          role: 'assistant',
                          timestamp: new Date(Date.now() - 1000 * 60 * 5),
                          children: [],
                          parentId: 'user3'
                        }
                      ],
                      parentId: 'assistant1'
                    }
                  ],
                  parentId: 'user1'
                }
              ],
              parentId: 'root'
            }
          ],
          parentId: null
        };
        
        setTreeData(mockTreeData);
        setLoading(false);
      } catch (err) {
        setError('加载对话树失败');
        setLoading(false);
        console.error('Error fetching chat tree:', err);
      }
    };
    
    fetchChatTree();
  }, [sessionId]);

  // 渲染树节点
  const renderTreeNode = (node: ChatNode, level: number = 0): JSX.Element => {
    const isActive = node.id === currentNodeId;
    const isUser = node.role === 'user';
    
    return (
      <div key={node.id} className="ml-4 relative">
        {/* 垂直连接线 */}
        {level > 0 && (
          <div 
            className="absolute left-[-12px] top-0 bottom-0 w-[2px] bg-border" 
            style={{ height: '100%' }}
          />
        )}
        
        {/* 节点内容 */}
        <div className={`
          relative border-l-2 pl-3 py-2 mb-2 rounded-sm
          ${isActive ? 'border-l-primary bg-primary/10' : 'border-l-border hover:border-l-primary/50'}
          ${isUser ? 'bg-accent/20' : ''}
          cursor-pointer
        `} onClick={() => onSelectNode(node.id)}>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <MessageCircle size={16} className={`mr-2 ${isUser ? 'text-blue-500' : 'text-green-500'}`} />
              <span className="text-sm font-medium">
                {isUser ? '用户' : '智能体'}
                <span className="text-xs text-muted-foreground ml-2">
                  {node.timestamp.toLocaleTimeString()}
                </span>
              </span>
            </div>
            
            <div className="flex space-x-1">
              {/* 创建分支按钮 */}
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
                      <GitBranch size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>从该消息创建新分支</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* 删除分支按钮 */}
              {node.id !== 'root' && level > 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:bg-destructive/10" 
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
              
              {/* 当前活动标记 */}
              {isActive && (
                <Badge variant="outline" className="bg-primary/30 border-primary text-xs">
                  当前
                </Badge>
              )}
            </div>
          </div>
          
          {/* 消息预览 */}
          <div className="mt-1 text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {node.text.length > 60 ? `${node.text.substring(0, 60)}...` : node.text}
          </div>
        </div>
        
        {/* 子节点 */}
        {node.children.length > 0 && (
          <div className="ml-2">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4 text-center">加载对话树...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">{error}</div>;
  }

  if (!treeData) {
    return <div className="p-4 text-center">无对话数据</div>;
  }

  return (
    <div className="h-full flex flex-col border-r border-border">
      <div className="p-3 border-b border-border">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">对话树</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus size={16} className="mr-1" />
                  新分支
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>创建新的对话分支</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          查看对话的所有分支和历史记录
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3">
          {renderTreeNode(treeData)}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatTree; 