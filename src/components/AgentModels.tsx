import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
import * as SessionService from '../services/session';
import { useNavigate } from 'react-router-dom';

// 智能体类型定义
interface AgentModel {
  id: string;
  name: string;
  description: string;
}

interface AgentModelsProps {
  className?: string;
}

const defaultAgents: AgentModel[] = [
  {
    id: 'creative-writer',
    name: '创意写作',
    description: '帮助创作文章、小说、诗歌等创意内容，提供写作灵感和建议。'
  },
  {
    id: 'agent',
    name: '通用助手',
    description: '可以回答各种问题的AI助手'
  },
  {
    id: 'code-assistant',
    name: '代码助手',
    description: '帮助解决编程和开发问题'
  },
  {
    id: 'math-solver',
    name: '数学助手',
    description: '解答数学问题和计算'
  }
];

const AgentModels: React.FC<AgentModelsProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  // 处理开始对话
  const handleStartChat = async (agentId: string, agentName: string) => {
    try {
      setLoading(agentId);
      
      // 检查是否有已存在的相同智能体的会话
      const sessions = SessionService.getSessions();
      const existingSession = sessions.find((s: { agentId: string }) => s.agentId === agentId);
      
      let sessionId;
      
      if (existingSession) {
        // 如果存在相同智能体的会话，使用它
        sessionId = existingSession.id;
        console.log("[SessionService] 使用现有会话:", sessionId);
        
        // 设置为活跃会话
        SessionService.setActiveSession(sessionId);
      } else {
        // 否则创建新会话
        const session = await SessionService.createSession(agentId, agentName);
        sessionId = session.id;
        console.log("[SessionService] 创建新会话:", sessionId);
      }
      
      // 发送一个自定义事件，让Workspace组件知道需要打开特定会话
      // 确保在导航前先发送事件
      console.log("发送open-session事件，sessionId:", sessionId);
      const event = new CustomEvent('open-session', { 
        detail: { sessionId: sessionId } 
      });
      window.dispatchEvent(event);
      
      // 直接导航到工作区聊天页面
      navigate(`/workspace/chat?sessionId=${sessionId}`);
    } catch (error) {
      console.error('创建会话失败:', error);
      alert('创建会话失败，请重试');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {defaultAgents.map(agent => (
        <Card key={agent.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{agent.name}</CardTitle>
            <CardDescription>
              {agent.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {/* 可以添加更多内容 */}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button 
              className="w-full" 
              onClick={() => handleStartChat(agent.id, agent.name)}
              disabled={loading === agent.id}
            >
              {loading === agent.id ? (
                '处理中...' 
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  开始对话
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AgentModels; 