import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BarChart, PieChart, LineChart, Info, Trash2 } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExecutionRecord, 
  ExecutionStatus, 
  ExecutionLog,
  workflowService 
} from '@/api/WorkflowService';
import { cn } from '@/lib/utils';

// 定义日志级别类型
type LogLevel = 'info' | 'warning' | 'error';

interface WorkflowHistoryPanelProps {
  workflowId: string;
  onViewExecution?: (executionId: string) => void;
}

export function WorkflowHistoryPanel({ workflowId, onViewExecution }: WorkflowHistoryPanelProps) {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalExecutions: 0,
    successRate: 0,
    averageDuration: 0,
    executionsByDay: [] as { date: string; count: number }[],
    statusDistribution: [] as { status: string; count: number }[]
  });

  // 加载执行历史记录
  useEffect(() => {
    if (workflowId) {
      loadExecutions();
    }
  }, [workflowId]);

  // 加载执行记录
  const loadExecutions = () => {
    const records = workflowService.getWorkflowExecutions(workflowId);
    setExecutions(records.sort((a, b) => b.startTime - a.startTime));
    calculateAnalytics(records);
  };

  // 计算分析数据
  const calculateAnalytics = (records: ExecutionRecord[]) => {
    if (!records.length) {
      setAnalytics({
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        executionsByDay: [],
        statusDistribution: []
      });
      return;
    }

    // 总执行次数
    const totalExecutions = records.length;

    // 成功率
    const successfulExecutions = records.filter(r => r.status === ExecutionStatus.COMPLETED).length;
    const successRate = (successfulExecutions / totalExecutions) * 100;

    // 平均执行时间
    const completedExecutions = records.filter(r => r.endTime);
    const totalDuration = completedExecutions.reduce((total, record) => {
      if (record.endTime) {
        return total + (record.endTime - record.startTime);
      }
      return total;
    }, 0);
    const averageDuration = completedExecutions.length > 0 
      ? totalDuration / completedExecutions.length 
      : 0;

    // 按日期分组
    const executionsByDay = groupExecutionsByDay(records);

    // 状态分布
    const statusCounts: Record<string, number> = {};
    records.forEach(record => {
      statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
    });
    
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    setAnalytics({
      totalExecutions,
      successRate,
      averageDuration,
      executionsByDay,
      statusDistribution
    });
  };

  // 按日期分组执行记录
  const groupExecutionsByDay = (records: ExecutionRecord[]) => {
    const groupedByDay: Record<string, number> = {};
    
    records.forEach(record => {
      const date = format(record.startTime, 'yyyy-MM-dd');
      groupedByDay[date] = (groupedByDay[date] || 0) + 1;
    });

    return Object.entries(groupedByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // 查看执行详情
  const handleViewExecution = (execution: ExecutionRecord) => {
    setSelectedExecution(execution);
    if (onViewExecution) {
      onViewExecution(execution.id);
    } else {
      setShowExecutionDialog(true);
    }
  };

  // 删除执行记录
  const handleDeleteExecution = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除此执行记录吗？此操作无法撤销。')) {
      workflowService.deleteExecution(id);
      loadExecutions();
    }
  };

  // 清空执行记录
  const handleClearExecutions = () => {
    if (confirm('确定要清空所有执行记录吗？此操作无法撤销。')) {
      workflowService.clearWorkflowExecutions(workflowId);
      loadExecutions();
    }
  };

  // 格式化时间
  const formatDateTime = (timestamp: number) => {
    return format(timestamp, 'yyyy-MM-dd HH:mm:ss');
  };

  // 格式化持续时间
  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return '-';
    
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds}秒`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}分${remainingSeconds}秒`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}时${remainingMinutes}分${remainingSeconds}秒`;
  };

  // 获取状态标签样式
  const getStatusBadge = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.COMPLETED:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">成功</Badge>;
      case ExecutionStatus.FAILED:
        return <Badge variant="destructive">失败</Badge>;
      case ExecutionStatus.RUNNING:
        return <Badge variant="secondary">运行中</Badge>;
      case ExecutionStatus.CANCELED:
        return <Badge variant="outline">已取消</Badge>;
      case ExecutionStatus.PENDING:
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">等待中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 获取日志级别样式
  const getLogLevelStyles = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'text-red-500 bg-red-50 dark:bg-red-950 dark:text-red-300';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300';
      case 'info':
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  if (!workflowId) {
    return (
      <div className="p-8 text-center">
        <div className="text-muted-foreground">请先保存工作流</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-card">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">执行历史</h3>
            <p className="text-sm text-muted-foreground">
              {executions.length > 0
                ? `共 ${executions.length} 条执行记录，成功率 ${analytics.successRate.toFixed(1)}%`
                : '暂无执行记录'}
            </p>
          </div>
          {executions.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearExecutions}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空记录
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="history" className="flex-1 flex flex-col">
        <TabsList className="px-4 pt-2 justify-start">
          <TabsTrigger value="history">执行记录</TabsTrigger>
          <TabsTrigger value="analytics">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {executions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>执行ID</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>用时</TableHead>
                    <TableHead className="text-center">状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map(execution => (
                    <TableRow 
                      key={execution.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewExecution(execution)}
                    >
                      <TableCell className="font-mono text-xs">
                        {execution.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(execution.startTime, 'MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(execution.startTime, execution.endTime)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(execution.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDeleteExecution(execution.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>删除执行记录</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>暂无执行记录</p>
                <p className="text-sm mt-1">运行工作流后将在此显示执行历史</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 overflow-auto p-4">
          {executions.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <BarChart className="h-4 w-4 mr-2 text-primary" />
                      总执行次数
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {analytics.totalExecutions}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <PieChart className="h-4 w-4 mr-2 text-primary" />
                      成功率
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {analytics.successRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <LineChart className="h-4 w-4 mr-2 text-primary" />
                      平均执行时间
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {(analytics.averageDuration / 1000).toFixed(1)}秒
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">状态分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {analytics.statusDistribution.map(item => (
                      <div key={item.status} className="flex flex-col items-center">
                        <div className="text-2xl font-bold">{item.count}</div>
                        <div className="mt-1">
                          {getStatusBadge(item.status as ExecutionStatus)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">每日执行次数</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.executionsByDay.length > 1 ? (
                    <div>
                      <div className="h-40 flex items-end gap-1">
                        {analytics.executionsByDay.map(day => {
                          const maxCount = Math.max(...analytics.executionsByDay.map(d => d.count));
                          const heightPercent = (day.count / maxCount) * 100;
                          
                          return (
                            <div 
                              key={day.date} 
                              className="group relative flex-1 bg-primary hover:bg-primary/80 rounded-t"
                              style={{ height: `${heightPercent}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-card border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {day.date}: {day.count}次
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <div>{analytics.executionsByDay[0].date}</div>
                        <div>{analytics.executionsByDay[analytics.executionsByDay.length - 1].date}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      需要更多数据来显示趋势
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Info className="h-12 w-12 mb-2 text-muted-foreground/50" />
              <p>暂无分析数据</p>
              <p className="text-sm mt-1">运行工作流后将生成统计分析</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 执行详情对话框 */}
      <Dialog open={showExecutionDialog} onOpenChange={setShowExecutionDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>执行详情</DialogTitle>
            <DialogDescription>
              执行ID: {selectedExecution?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4 max-h-[80vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">基本信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">工作流:</span>
                      <span className="font-medium">{selectedExecution.workflowName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">开始时间:</span>
                      <span>{formatDateTime(selectedExecution.startTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">结束时间:</span>
                      <span>
                        {selectedExecution.endTime 
                          ? formatDateTime(selectedExecution.endTime) 
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">持续时间:</span>
                      <span>
                        {formatDuration(
                          selectedExecution.startTime, 
                          selectedExecution.endTime
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">状态:</span>
                      <span>{getStatusBadge(selectedExecution.status)}</span>
                    </div>
                    {selectedExecution.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription>
                          {selectedExecution.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">变量</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40">
                      {Object.keys(selectedExecution.variables).length > 0 ? (
                        <pre className="text-xs font-mono">
                          {JSON.stringify(selectedExecution.variables, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-center p-4 text-muted-foreground">
                          无变量数据
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">执行日志</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-60">
                    {selectedExecution.logs && selectedExecution.logs.length > 0 ? (
                      <div className="space-y-1">
                        {selectedExecution.logs.map((log: ExecutionLog) => (
                          <div 
                            key={log.id} 
                            className={cn(
                              "flex text-xs p-1 rounded", 
                              getLogLevelStyles(log.level as LogLevel)
                            )}
                          >
                            <span className="w-28 shrink-0 text-muted-foreground">
                              {format(log.timestamp, 'HH:mm:ss.SSS')}
                            </span>
                            <span className="w-20 shrink-0 font-medium">
                              {log.level.toUpperCase()}
                            </span>
                            <span className="w-32 shrink-0 overflow-hidden text-ellipsis">
                              {log.nodeName || '-'}
                            </span>
                            <span className="break-all">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        无日志记录
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">节点结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-60">
                    <div className="space-y-3">
                      {Object.entries(selectedExecution.nodeResults).length > 0 ? (
                        Object.entries(selectedExecution.nodeResults).map(([nodeId, result]) => (
                          <div key={nodeId} className="border rounded-md p-3">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium">{nodeId}</div>
                              {result.success ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">成功</Badge>
                              ) : (
                                <Badge variant="destructive">失败</Badge>
                              )}
                            </div>
                            
                            {result.data && (
                              <div className="mt-2">
                                <h4 className="text-xs text-muted-foreground mb-1">结果数据:</h4>
                                <pre className="text-xs bg-muted/30 p-2 rounded overflow-auto max-h-40">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {result.error && (
                              <div className="mt-2">
                                <h4 className="text-xs text-red-500 mb-1">错误信息:</h4>
                                <pre className="text-xs bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 p-2 rounded overflow-auto max-h-40">
                                  {result.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 text-muted-foreground">
                          无节点结果
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 