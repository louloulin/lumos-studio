import React, { useState, useEffect } from 'react';
import { Session } from '../types/chat';
import { SessionAnalysis as SessionAnalysisResult, analyzeSession, analyzeAgentCollaboration } from '../services/analysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Bot, Zap, Lightbulb, ArrowRight, Repeat, List, Users } from 'lucide-react';

interface SessionAnalysisProps {
  session: Session;
  className?: string;
  onClose?: () => void;
}

/**
 * 会话分析组件
 * 显示来自多智能体会话的见解和分析
 */
export const SessionAnalysis: React.FC<SessionAnalysisProps> = ({ 
  session, 
  className = '',
  onClose
}) => {
  const [analysis, setAnalysis] = useState<SessionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [collaboration, setCollaboration] = useState<ReturnType<typeof analyzeAgentCollaboration> | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // 执行会话分析
  const runAnalysis = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      // 分析会话内容
      const result = await analyzeSession(session);
      setAnalysis(result);
      
      // 分析智能体协作情况
      const collabResult = analyzeAgentCollaboration(session);
      setCollaboration(collabResult);
    } catch (error) {
      console.error('分析会话时出错:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 首次加载时自动分析
  useEffect(() => {
    if (session && session.messages.length > 0) {
      runAnalysis();
    }
  }, [session?.id]);
  
  if (!session) {
    return null;
  }
  
  return (
    <Card className={`session-analysis ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            会话分析
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
        <CardDescription>
          从多智能体对话中提取的见解和分析
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="summary" className="flex-1">
              <Lightbulb className="h-4 w-4 mr-2" />
              摘要
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">
              <List className="h-4 w-4 mr-2" />
              要点
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              智能体
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">正在分析会话...</p>
            </div>
          ) : (
            <>
              <TabsContent value="summary" className="mt-0">
                {analysis ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">会话摘要</h3>
                      <p className="text-sm">{analysis.summary || '无法生成摘要'}</p>
                    </div>
                    
                    {analysis.nextSteps.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">建议的后续步骤</h3>
                        <ul className="text-sm space-y-1">
                          {analysis.nextSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.relatedTopics.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">相关话题</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.relatedTopics.map((topic, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">暂无分析数据</p>
                    <Button onClick={runAnalysis} variant="outline" size="sm" className="mt-2">
                      <Repeat className="h-4 w-4 mr-2" />
                      开始分析
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="insights" className="mt-0">
                {analysis?.keyPoints.length ? (
                  <div>
                    <h3 className="text-sm font-medium mb-2">关键要点</h3>
                    <ul className="space-y-3">
                      {analysis.keyPoints.map((point, i) => (
                        <li key={i} className="bg-secondary/30 p-3 rounded-md">
                          <div className="flex gap-2">
                            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="text-sm">{point}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {analysis ? '没有发现关键要点' : '暂无分析数据'}
                    </p>
                    {!analysis && (
                      <Button onClick={runAnalysis} variant="outline" size="sm" className="mt-2">
                        <Repeat className="h-4 w-4 mr-2" />
                        开始分析
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="agents" className="mt-0">
                {collaboration ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-medium">智能体协作</h3>
                        {collaboration.collaborationScore > 0 && (
                          <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                            协作得分: {Math.round(collaboration.collaborationScore)}
                          </span>
                        )}
                      </div>
                      
                      {collaboration.collaborationScore > 0 ? (
                        <Progress 
                          value={collaboration.collaborationScore} 
                          className="h-2" 
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          此会话中只有一个智能体活跃，无法计算协作得分
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">智能体贡献</h3>
                      <div className="space-y-2">
                        {collaboration.contributions.map((contrib) => (
                          <div key={contrib.agentId} className="bg-secondary/30 p-3 rounded-md">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{contrib.agentName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {contrib.messageCount} 条消息
                              </span>
                            </div>
                            <Progress 
                              value={contrib.messageCount / analysis!.messageCount * 100} 
                              className="h-1.5" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      总计: {collaboration.activeAgents}/{collaboration.totalAgents} 个智能体参与了对话
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">暂无智能体协作数据</p>
                    <Button onClick={runAnalysis} variant="outline" size="sm" className="mt-2">
                      <Repeat className="h-4 w-4 mr-2" />
                      开始分析
                    </Button>
                  </div>
                )}
              </TabsContent>
            </>
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={runAnalysis}
              disabled={loading}
            >
              <Repeat className="h-4 w-4 mr-2" />
              刷新分析
            </Button>
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}; 