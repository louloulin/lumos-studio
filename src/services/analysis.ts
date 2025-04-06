/**
 * 会话分析服务
 * 用于从多智能体会话中提取洞见和智能建议
 */

import { Session, Message } from '../types/chat';
import { MastraAPI } from '../api/mastra';

/**
 * 会话分析结果
 */
export interface SessionAnalysis {
  summary: string;
  keyPoints: string[];
  nextSteps: string[];
  relatedTopics: string[];
  messageCount: number;
  agentContribution: Record<string, number>; // 智能体ID -> 消息数量
  sentimentScore?: number; // 情感得分（可选）
  complexity?: number; // 复杂度（可选）
}

/**
 * 分析选项
 */
export interface AnalysisOptions {
  includeSummary?: boolean;
  includeKeyPoints?: boolean;
  includeNextSteps?: boolean;
  includeRelatedTopics?: boolean;
  maxMessages?: number; // 分析最近的N条消息
}

// 默认分析选项
const defaultOptions: AnalysisOptions = {
  includeSummary: true,
  includeKeyPoints: true,
  includeNextSteps: true,
  includeRelatedTopics: true,
  maxMessages: 50,
};

/**
 * 分析会话，提取关键信息
 * @param session 会话对象
 * @param options 分析选项
 * @returns 会话分析结果
 */
export async function analyzeSession(
  session: Session,
  options: AnalysisOptions = {}
): Promise<SessionAnalysis> {
  const opts = { ...defaultOptions, ...options };
  
  // 基本分析数据
  const analysis: SessionAnalysis = {
    summary: '',
    keyPoints: [],
    nextSteps: [],
    relatedTopics: [],
    messageCount: session.messages.length,
    agentContribution: {},
  };
  
  // 统计各智能体贡献
  session.messages.forEach(msg => {
    if (msg.agentId && msg.role === 'assistant') {
      analysis.agentContribution[msg.agentId] = 
        (analysis.agentContribution[msg.agentId] || 0) + 1;
    }
  });
  
  // 提取最近的N条消息用于分析
  const messagesToAnalyze = session.messages
    .filter(m => m.role !== 'system')
    .slice(-opts.maxMessages!);
  
  if (messagesToAnalyze.length === 0) {
    return analysis;
  }
  
  try {
    // 使用分析智能体进行会话内容分析
    const analysisPrompt = generateAnalysisPrompt(messagesToAnalyze, opts);
    
    // 使用特殊的"analyst"智能体，如果不存在则使用会话的默认智能体
    const analysisAgentId = 'analyst';
    let useAgentId = '';
    
    try {
      const analyst = await MastraAPI.getAgent(analysisAgentId);
      if (analyst) {
        useAgentId = analysisAgentId;
      } else {
        useAgentId = session.defaultAgentId;
      }
    } catch (error) {
      useAgentId = session.defaultAgentId;
    }
    
    const result = await MastraAPI.generate(useAgentId, {
      messages: [
        { role: 'system', content: '你是一个专业的会话分析师，擅长从对话中提取关键信息和洞见。' },
        { role: 'user', content: analysisPrompt }
      ]
    });
    
    if (result?.text) {
      // 解析结果
      const analysisText = result.text;
      parseAnalysisResult(analysisText, analysis);
    }
    
    return analysis;
  } catch (error) {
    console.error('分析会话时出错:', error);
    return analysis;
  }
}

/**
 * 生成分析提示词
 */
function generateAnalysisPrompt(messages: Message[], options: AnalysisOptions): string {
  let prompt = `请分析以下对话内容`;
  
  if (options.includeSummary) {
    prompt += `，并提供一个简短摘要`;
  }
  
  if (options.includeKeyPoints) {
    prompt += `，列出3-5个关键要点`;
  }
  
  if (options.includeNextSteps) {
    prompt += `，提出2-3个可能的后续步骤或问题`;
  }
  
  if (options.includeRelatedTopics) {
    prompt += `，建议2-3个相关话题`;
  }
  
  prompt += `:\n\n`;
  
  // 添加消息内容
  messages.forEach(msg => {
    const role = msg.role === 'assistant' ? 
      (msg.agentName || '助手') : 
      (msg.role === 'user' ? '用户' : '系统');
    
    prompt += `${role}: ${msg.content}\n`;
  });
  
  prompt += `\n请以JSON格式返回结果，包含以下字段：summary, keyPoints, nextSteps, relatedTopics`;
  
  return prompt;
}

/**
 * 解析分析结果
 */
function parseAnalysisResult(text: string, analysis: SessionAnalysis): void {
  try {
    // 尝试提取JSON
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.summary) {
        analysis.summary = parsed.summary;
      }
      
      if (Array.isArray(parsed.keyPoints)) {
        analysis.keyPoints = parsed.keyPoints;
      }
      
      if (Array.isArray(parsed.nextSteps)) {
        analysis.nextSteps = parsed.nextSteps;
      }
      
      if (Array.isArray(parsed.relatedTopics)) {
        analysis.relatedTopics = parsed.relatedTopics;
      }
      
      if (typeof parsed.sentimentScore === 'number') {
        analysis.sentimentScore = parsed.sentimentScore;
      }
      
      if (typeof parsed.complexity === 'number') {
        analysis.complexity = parsed.complexity;
      }
    } else {
      // 如果无法解析JSON，尝试使用启发式方法提取信息
      
      // 提取摘要
      const summaryMatch = text.match(/摘要[:：]\s*(.+)$/m);
      if (summaryMatch) {
        analysis.summary = summaryMatch[1].trim();
      }
      
      // 提取关键要点
      const keyPointsSection = text.match(/关键要点[:：]?\s*([\s\S]*?)(?=后续步骤|相关话题|$)/i);
      if (keyPointsSection) {
        const points = keyPointsSection[1].match(/[-•*]\s*(.+)$/gm);
        if (points) {
          analysis.keyPoints = points.map(p => p.replace(/^[-•*]\s*/, '').trim());
        }
      }
      
      // 提取后续步骤
      const nextStepsSection = text.match(/后续步骤[:：]?\s*([\s\S]*?)(?=相关话题|$)/i);
      if (nextStepsSection) {
        const steps = nextStepsSection[1].match(/[-•*]\s*(.+)$/gm);
        if (steps) {
          analysis.nextSteps = steps.map(s => s.replace(/^[-•*]\s*/, '').trim());
        }
      }
      
      // 提取相关话题
      const topicsSection = text.match(/相关话题[:：]?\s*([\s\S]*?)(?=$)/i);
      if (topicsSection) {
        const topics = topicsSection[1].match(/[-•*]\s*(.+)$/gm);
        if (topics) {
          analysis.relatedTopics = topics.map(t => t.replace(/^[-•*]\s*/, '').trim());
        }
      }
    }
  } catch (error) {
    console.error('解析分析结果时出错:', error);
  }
}

/**
 * 执行快速会话摘要分析
 * @param session 会话对象
 * @returns 会话摘要
 */
export async function quickSessionSummary(session: Session): Promise<string> {
  if (session.messages.length === 0) {
    return '会话尚未开始';
  }
  
  try {
    const result = await analyzeSession(session, {
      includeSummary: true,
      includeKeyPoints: false,
      includeNextSteps: false,
      includeRelatedTopics: false,
      maxMessages: 20,
    });
    
    return result.summary || '无法生成摘要';
  } catch (error) {
    console.error('生成会话摘要时出错:', error);
    return '生成摘要时出错';
  }
}

/**
 * 分析智能体协作情况
 * @param session 会话对象
 * @returns 智能体协作分析
 */
export function analyzeAgentCollaboration(session: Session): {
  totalAgents: number;
  activeAgents: number;
  contributions: {agentId: string, agentName: string, messageCount: number}[];
  collaborationScore: number;
} {
  const agentMessages = session.messages.filter(
    m => m.role === 'assistant' && m.agentId
  );
  
  // 统计每个智能体的消息数
  const agentCounts: Record<string, {count: number, name: string}> = {};
  
  agentMessages.forEach(msg => {
    if (msg.agentId) {
      if (!agentCounts[msg.agentId]) {
        agentCounts[msg.agentId] = {
          count: 0,
          name: msg.agentName || msg.agentId
        };
      }
      agentCounts[msg.agentId].count++;
    }
  });
  
  // 将统计结果转换为数组，并按消息数排序
  const contributions = Object.entries(agentCounts).map(([agentId, data]) => ({
    agentId,
    agentName: data.name,
    messageCount: data.count
  })).sort((a, b) => b.messageCount - a.messageCount);
  
  // 计算协作得分（简化版）- 基于智能体参与的均衡性
  const totalAgents = session.agentIds.length;
  const activeAgents = contributions.length;
  
  // 如果只有一个或没有智能体，协作得分为0
  if (activeAgents <= 1) {
    return {
      totalAgents,
      activeAgents,
      contributions,
      collaborationScore: 0
    };
  }
  
  // 计算智能体消息分布的方差，越低表示越均衡
  const totalMessages = contributions.reduce((sum, c) => sum + c.messageCount, 0);
  const idealDistribution = totalMessages / activeAgents;
  
  // 计算方差
  const variance = contributions.reduce(
    (v, c) => v + Math.pow(c.messageCount - idealDistribution, 2),
    0
  ) / activeAgents;
  
  // 将方差转换为0-100的协作得分，方差越低，得分越高
  const maxVariance = Math.pow(totalMessages, 2);
  const collaborationScore = Math.max(0, Math.min(100, 100 * (1 - variance / maxVariance)));
  
  return {
    totalAgents,
    activeAgents,
    contributions,
    collaborationScore
  };
}

export default {
  analyzeSession,
  quickSessionSummary,
  analyzeAgentCollaboration
}; 