import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageSquare, Info } from 'lucide-react';
import { Badge } from './ui/badge';

// 智能体类型定义
interface SmartAgent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  categories?: string[];
}

interface SmartAgentGalleryProps {
  agents: SmartAgent[];
  onStartChat: (agentId: string, agentName: string) => void;
}

const SmartAgentGallery: React.FC<SmartAgentGalleryProps> = ({ agents, onStartChat }) => {
  if (!agents || agents.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">没有找到智能体</h3>
        <p className="text-muted-foreground mb-4">
          当前没有可用的智能体。请添加智能体或查看智能体市场。
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map(agent => (
        <Card key={agent.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={agent.avatar} alt={agent.name} />
                  <AvatarFallback>
                    {agent.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <CardDescription className="line-clamp-3 mb-2">
              {agent.description}
            </CardDescription>
            <div className="flex flex-wrap gap-1 mt-2">
              {agent.categories?.map(category => (
                <Badge key={category} variant="outline">{category}</Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button 
              className="w-full"
              onClick={() => onStartChat(agent.id, agent.name)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              开始对话
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SmartAgentGallery; 