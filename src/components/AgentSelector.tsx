import React, { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import * as atoms from '../stores/atoms';
import * as sessionActions from '../stores/sessionActions';
import { MastraAPI } from '../api/mastra';

interface AgentSelectorProps {
  sessionId: string;
  onAgentChange?: (agentId: string) => void;
}

/**
 * 智能体选择器组件
 * 允许用户在会话中选择、添加或移除智能体
 */
export const AgentSelector: React.FC<AgentSelectorProps> = ({ 
  sessionId, 
  onAgentChange 
}) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = useAtomValue(atoms.currentSessionAtom);
  
  // 加载可用智能体
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true);
        const allAgents = await MastraAPI.getAllAgents();
        setAgents(allAgents);
      } catch (error) {
        console.error('Failed to load agents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAgents();
  }, []);
  
  // 切换默认智能体
  const handleAgentChange = (agentId: string) => {
    sessionActions.setSessionDefaultAgent(sessionId, agentId);
    if (onAgentChange) {
      onAgentChange(agentId);
    }
  };
  
  // 添加智能体到会话
  const handleAddAgent = (agentId: string) => {
    sessionActions.addAgentToSession(sessionId, agentId);
  };
  
  // 从会话中移除智能体
  const handleRemoveAgent = (agentId: string) => {
    sessionActions.removeAgentFromSession(sessionId, agentId);
  };
  
  if (!session) {
    return null;
  }
  
  return (
    <div className="agent-selector p-3 border rounded-md shadow-sm">
      <div className="current-agent">
        <div className="flex items-center">
          <span className="text-sm font-medium">当前智能体: </span>
          <select 
            value={session.defaultAgentId}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="ml-2 p-1 border rounded text-sm"
          >
            {session.agentIds.map(agentId => {
              const agent = agents.find(a => a.id === agentId);
              return (
                <option key={agentId} value={agentId}>
                  {agent?.name || agentId}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      
      <div className="available-agents mt-4">
        <h4 className="text-sm font-medium">可用智能体</h4>
        {loading ? (
          <p className="text-sm text-gray-500">加载中...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {agents.map(agent => (
              <div 
                key={agent.id} 
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm truncate" title={agent.name || agent.id}>
                  {agent.name || agent.id}
                </span>
                {session.agentIds.includes(agent.id) ? (
                  <button
                    onClick={() => handleRemoveAgent(agent.id)}
                    disabled={session.defaultAgentId === agent.id}
                    className={`text-xs px-2 py-1 rounded ${
                      session.defaultAgentId === agent.id 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    移除
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddAgent(agent.id)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    添加
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!loading && agents.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">未找到可用智能体</p>
        )}
      </div>
      
      <div className="mt-4">
        <button 
          className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 w-full"
          onClick={() => {
            if (session.agentIds.length > 1) {
              sessionActions.sendMessageToMultipleAgents(
                sessionId,
                "请用一句话介绍你自己",
                session.agentIds
              );
            } else {
              alert("请先添加多个智能体到会话中");
            }
          }}
        >
          让所有智能体自我介绍
        </button>
      </div>
    </div>
  );
}; 