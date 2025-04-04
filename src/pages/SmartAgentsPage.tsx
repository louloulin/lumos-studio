import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartAgentGallery from '../components/SmartAgentGallery';
import * as SessionService from '../services/session';

// 默认智能体列表
const defaultAgents = [
  {
    id: 'gpt-4',
    name: '通用助手',
    description: '可以回答各种问题的AI助手',
    categories: ['通用', '助手']
  },
  {
    id: 'code-assistant',
    name: '代码助手',
    description: '帮助解决编程和开发问题',
    categories: ['开发', '编程']
  },
  {
    id: 'creative-writer',
    name: '创意写作',
    description: '帮助创作文章、小说、诗歌等创意内容，提供写作灵感和建议。',
    categories: ['创意', '写作']
  },
  {
    id: 'math-solver',
    name: '数学助手',
    description: '解答数学问题和计算',
    categories: ['教育', '学术']
  }
];

const SmartAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState(defaultAgents);

  // 获取智能体列表
  useEffect(() => {
    // 这里可以添加从API获取智能体列表的代码
    // 为了演示，我们使用默认列表
  }, []);

  // 处理开始对话
  const handleStartChat = async (agentId: string, agentName: string) => {
    try {
      // 直接创建新会话 - 添加await，因为这是一个异步函数
      const session = await SessionService.createSession(agentId, agentName);
      
      // 创建完会话后直接导航到会话页面
      navigate('/');
      
      // 添加一个小延迟确保页面已更新
      setTimeout(() => {
        // 发送一个自定义事件，让Workspace组件知道需要打开特定会话
        const event = new CustomEvent('open-session', { 
          detail: { sessionId: session.id } 
        });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('创建会话失败:', error);
      alert('创建会话失败，请重试');
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">智能体</h1>
          <p className="text-muted-foreground">选择一个智能体开始对话</p>
        </div>
      </div>

      <SmartAgentGallery agents={agents} onStartChat={handleStartChat} />
    </div>
  );
};

export default SmartAgentsPage; 