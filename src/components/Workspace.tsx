import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  PlusCircle, 
  Settings as SettingsIcon, 
  Store, 
  Users, 
  Menu, 
  X,
  ChevronLeft,
  Home,
  PanelLeft,
  Trash,
  LifeBuoy,
  LogOut,
  Bot,
  Share2,
  Puzzle
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Switch } from './ui/switch';
import MastraChat from './MastraChat';
import AgentMarket from './AgentMarket';
import AgentEditor from './AgentEditor';
import SettingsPage from './SettingsPage';
import WorkflowBuilder from './WorkflowBuilder';
import AgentsPage from "../pages/AgentsPage";
import { useNavigate } from 'react-router-dom';

// 定义会话类型
interface ChatSession {
  id: string;
  name: string;
  agentId: string;
  lastMessage?: string;
  lastUpdated: Date;
  pinned?: boolean;
}

// 视图类型
type ViewType = 'chat' | 'market' | 'editor' | 'settings' | 'workflow' | 'agent-manager' | 'plugins';

interface WorkspaceProps {
  currentPage: string;
}

const Workspace: React.FC<WorkspaceProps> = ({ currentPage }) => {
  // 会话管理
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // 页面状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const initializedRef = useRef(false);
  const navigate = useNavigate();
  
  // 从URL获取初始视图
  useEffect(() => {
    // 如果接收到currentPage属性，使用它来设置活动视图
    if (currentPage) {
      switch (currentPage) {
        case 'chat':
          setActiveView('chat');
          break;
        case 'agents':
          setActiveView('agent-manager');
          break;
        case 'whiteboard':
          setActiveView('workflow');
          break;
        case 'plugins':
          setActiveView('plugins');
          break;
        case 'home':
        default:
          setActiveView('chat');
          break;
      }
    }
  }, [currentPage]);

  // 更新路由导航逻辑
  const navigateTo = (view: ViewType, id?: string) => {
    setActiveView(view);
    
    // 根据视图类型设置URL，统一使用 React Router 导航
    switch (view) {
      case 'chat':
        if (id) {
          navigate(`/chat/${id}`);
          setSelectedSessionId(id);
        } else {
          navigate('/chat');
        }
        break;
      case 'market':
        navigate('/agents/market');
        break;
      case 'editor':
        if (id) {
          navigate(`/editor/${id}`);
        } else {
          navigate('/editor');
        }
        break;
      case 'workflow':
        navigate('/workflow');
        break;
      case 'agent-manager':
        navigate('/agents');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'plugins':
        navigate('/plugins/market');
        break;
      default:
        navigate('/');
        break;
    }
    
    // 如果在聊天视图，确保currentSession正确反映选择的会话
    setTimeout(() => {
      if (view === 'chat' && id) {
        const session = sessions.find(s => s.id === id);
        if (session) {
          setSelectedSessionId(id);
        }
      }
    }, 50);
  };
  
  // 监听窗口大小变化
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化示例会话数据
  useEffect(() => {
    // 避免重复初始化
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const demoSessions: ChatSession[] = [
      {
        id: '1',
        name: '通用助手',
        agentId: 'gpt-4',
        lastMessage: '有什么我可以帮助你的？',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 5),
        pinned: true
      },
      {
        id: '2',
        name: '代码助手',
        agentId: 'code-assistant',
        lastMessage: '我可以帮助你解决编程问题。',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: '3',
        name: '创意写作',
        agentId: 'creative-writer',
        lastMessage: '让我们一起创作精彩的内容！',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    ];
    
    setSessions(demoSessions);
    setSelectedSessionId('1');
    // 使用setTimeout避免在状态更新过程中修改URL
    setTimeout(() => {
      if (currentPage === 'chat' || !currentPage) {
        navigateTo('chat', '1');
      }
    }, 0);
  }, [navigate, currentPage]);

  // 创建新会话
  const createNewSession = (agentId: string, name: string) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      name,
      agentId,
      lastUpdated: new Date()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setSelectedSessionId(newSession.id);
    setShowNewSessionDialog(false);
    navigateTo('chat', newSession.id);
  };

  // 获取当前会话
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === selectedSessionId) || null, 
    [sessions, selectedSessionId]
  );

  // 删除会话
  const deleteSession = (sessionId: string) => {
    if (window.confirm('确定要删除这个会话吗？此操作不可撤销。')) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(sessions.length > 1 ? sessions[0].id : null);
      }
    }
  };

  // 固定/取消固定会话
  const togglePinSession = (sessionId: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, pinned: !session.pinned } 
          : session
      )
    );
  };

  // 格式化最后更新时间
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return `${diffDays}天前`;
    }
  };

  // 渲染主内容
  const renderMainContent = () => {
    // 如果currentPage属性被提供，我们用它来决定显示哪个页面
    if (currentPage) {
      switch (currentPage) {
        case 'agents':
          return <AgentsPage />;
        case 'workflow':
          return <WorkflowBuilder />;
        case 'whiteboard':
          // 使用工作流组件代替不存在的Whiteboard组件
          return <WorkflowBuilder />;
        case 'plugins':
          // 这种情况会直接通过路由处理，不需要在这里渲染内容
          return null;
        case 'chat':
          // 如果是聊天页面，使用现有逻辑
          break;
        default:
          // 如果没有匹配的页面，继续使用现有逻辑
          break;
      }
    }
    
    // 使用现有的activeView逻辑作为后备
    if (activeView === 'chat' && currentSession) {
      return <MastraChat sessionId={currentSession.id} agentId={currentSession.agentId} />;
    } else if (activeView === 'market') {
      return <AgentMarket onSelectAgent={(agentId: string, agentName: string) => {
        createNewSession(agentId, agentName);
      }} mode="explore" />;
    } else if (activeView === 'agent-manager') {
      return <AgentMarket onSelectAgent={(agentId: string, agentName: string) => {
        setEditingAgentId(agentId);
        navigateTo('editor', agentId);
      }} mode="manage" />;
    } else if (activeView === 'editor') {
      return <AgentEditor agentId={editingAgentId || undefined} onSave={() => {
        if (editingAgentId) {
          navigateTo('agent-manager');
        } else {
          navigateTo('market');
        }
      }} />;
    } else if (activeView === 'settings') {
      return <SettingsPage />;
    } else if (activeView === 'workflow') {
      return <WorkflowBuilder />;
    } else if (activeView === 'plugins') {
      // 这种情况会直接通过路由处理，不需要在这里渲染内容
      return null;
    } else {
      return <div className="flex items-center justify-center h-full">请选择一个会话或功能</div>;
    }
  };

  // 渲染侧边栏
  const renderSidebar = () => (
    <aside
      className={`bg-background border-r border-border ${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : sidebarCollapsed 
          ? 'w-16' 
          : 'w-64'
      } flex flex-col`}
    >
      {/* 侧边栏头部 */}
      <div className="flex items-center p-2 h-14 border-b border-border">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold tracking-tight">
            {isMobile 
              ? '菜单' 
              : 'Lumos'}
          </h1>
        )}
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={sidebarCollapsed ? 'mx-auto' : 'ml-auto'}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* 功能按钮 */}
      <div className="p-2 border-b border-border">
        <Button 
          variant={activeView === 'chat' && selectedSessionId ? 'secondary' : 'ghost'}
          className={`w-full justify-${sidebarCollapsed ? 'center' : 'start'} mb-1`}
          onClick={() => {
            if (selectedSessionId) {
              navigateTo('chat', selectedSessionId);
            } else {
              setShowNewSessionDialog(true);
            }
            if (isMobile) setMobileSidebarOpen(false);
          }}
        >
          <Home className="h-5 w-5" />
          {!sidebarCollapsed && <span className="ml-2">首页</span>}
        </Button>
        
        <Button 
          variant={activeView === 'market' ? 'secondary' : 'ghost'}
          className={`w-full justify-${sidebarCollapsed ? 'center' : 'start'} mb-1`}
          onClick={() => {
            navigateTo('market');
            if (isMobile) setMobileSidebarOpen(false);
          }}
        >
          <Store className="h-5 w-5" />
          {!sidebarCollapsed && <span className="ml-2">模型市场</span>}
        </Button>
        
        <Button 
          variant={activeView === 'editor' ? 'secondary' : 'ghost'}
          className={`w-full justify-${sidebarCollapsed ? 'center' : 'start'} mb-1`}
          onClick={() => {
            navigateTo('editor');
            setEditingAgentId(null);
            if (isMobile) setMobileSidebarOpen(false);
          }}
        >
          <Bot className="h-5 w-5" />
          {!sidebarCollapsed && <span className="ml-2">模型编辑器</span>}
        </Button>

        <Button 
          variant={activeView === 'workflow' ? 'secondary' : 'ghost'}
          className={`w-full justify-${sidebarCollapsed ? 'center' : 'start'} mb-1`}
          onClick={() => {
            navigateTo('workflow');
            if (isMobile) setMobileSidebarOpen(false);
          }}
        >
          <Share2 className="h-5 w-5" />
          {!sidebarCollapsed && <span className="ml-2">工作流</span>}
        </Button>

        <Button 
          variant={activeView === 'agent-manager' ? 'secondary' : 'ghost'}
          className={`w-full justify-${sidebarCollapsed ? 'center' : 'start'} mb-1`}
          onClick={() => {
            navigateTo('agent-manager');
            if (isMobile) setMobileSidebarOpen(false);
          }}
        >
          <Users className="h-5 w-5" />
          {!sidebarCollapsed && <span className="ml-2">模型管理</span>}
        </Button>

        <Button 
          variant={activeView === 'plugins' ? 'secondary' : 'ghost'}
          className={`w-full justify-${sidebarCollapsed ? 'center' : 'start'} mb-1`}
          onClick={() => {
            navigateTo('plugins');
            if (isMobile) setMobileSidebarOpen(false);
          }}
        >
          <Puzzle className="h-5 w-5" />
          {!sidebarCollapsed && <span className="ml-2">插件市场</span>}
        </Button>
      </div>
      
      <Separator className="my-2" />
      
      {/* 会话列表 */}
      <div className="flex-1 overflow-auto">
        <div className="flex items-center px-4 py-2">
          {!sidebarCollapsed && <h2 className="text-sm font-semibold">会话</h2>}
          <Button 
            variant="ghost" 
            size="icon" 
            className={sidebarCollapsed ? 'mx-auto' : 'ml-auto'} 
            onClick={() => setShowNewSessionDialog(true)}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 固定的会话 */}
        {sessions.some(s => s.pinned) && (
          <div className="px-2 py-1">
            {!sidebarCollapsed && (
              <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">
                固定会话
              </h3>
            )}
            {sessions
              .filter(s => s.pinned)
              .map(session => (
                <div 
                  key={session.id}
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center py-3' : 'justify-between'
                  } px-2 py-2 rounded-md cursor-pointer group ${
                    selectedSessionId === session.id 
                      ? 'bg-accent' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    navigateTo('chat', session.id);
                    if (isMobile) setMobileSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center overflow-hidden">
                    <MessageSquare className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <div className="ml-2 overflow-hidden">
                        <h3 className="text-sm font-medium truncate">
                          {session.name}
                        </h3>
                        {session.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {session.lastMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!sidebarCollapsed && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinSession(session.id);
                              }}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="15" 
                                height="15" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="text-yellow-500"
                              >
                                <path d="m12 8-9.04-4.52a11.55 11.55 0 0 0 2.13 8.67L12 20l6.91-7.85a11.55 11.55 0 0 0 2.13-8.67L12 8Z" />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>取消固定</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>删除</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
        
        {/* 其他会话 */}
        <div className="px-2 py-1">
          {!sidebarCollapsed && sessions.some(s => !s.pinned) && (
            <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">
              其他会话
            </h3>
          )}
          {sessions
            .filter(s => !s.pinned)
            .map(session => (
              <div 
                key={session.id}
                className={`flex items-center ${
                  sidebarCollapsed ? 'justify-center py-3' : 'justify-between'
                } px-2 py-2 rounded-md cursor-pointer group ${
                  selectedSessionId === session.id 
                    ? 'bg-accent' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => {
                  setSelectedSessionId(session.id);
                  navigateTo('chat', session.id);
                  if (isMobile) setMobileSidebarOpen(false);
                }}
              >
                <div className="flex items-center overflow-hidden">
                  <MessageSquare className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="ml-2 overflow-hidden">
                      <h3 className="text-sm font-medium truncate">
                        {session.name}
                      </h3>
                      <div className="flex items-center">
                        {session.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {session.lastMessage}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground ml-1">
                          · {formatLastUpdated(session.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {!sidebarCollapsed && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinSession(session.id);
                            }}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="15" 
                              height="15" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <line x1="12" y1="17" x2="12" y2="3" />
                              <path d="M5 17h14v4H5z" />
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>固定会话</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>删除</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
      
      {/* 底部按钮 */}
      <div className="mt-auto p-2 border-t border-border">
        <Button 
          variant={activeView === 'settings' ? 'secondary' : 'ghost'}
          className={`w-full justify-${sidebarCollapsed ? 'center' : 'start'} mb-1`}
          onClick={() => navigateTo('settings')}
        >
          <SettingsIcon className="h-5 w-5" />
          {!sidebarCollapsed && <span className="ml-2">设置</span>}
        </Button>
        
        {!sidebarCollapsed && (
          <>
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-1"
            >
              <LifeBuoy className="h-5 w-5" />
              <span className="ml-2">帮助中心</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">退出登录</span>
            </Button>
          </>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      {renderSidebar()}
      
      {/* 主内容 */}
      <main className="flex-1 flex flex-col h-full">
        {/* 仅在移动视图显示的顶部栏 */}
        {isMobile && (
          <header className="flex items-center justify-between p-3 border-b border-border">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="text-lg font-semibold">
              {activeView === 'chat' && currentSession 
                ? currentSession.name 
                : activeView === 'market'
                ? '模型市场'
                : activeView === 'editor'
                ? '模型编辑器'
                : activeView === 'workflow'
                ? '工作流构建器'
                : activeView === 'agent-manager'
                ? '模型管理'
                : '设置'}
            </h1>
            
            <div className="w-8" /> {/* 占位元素，保持标题居中 */}
          </header>
        )}
        
        {/* 非移动设备顶部栏 */}
        {!isMobile && (
          <header className="flex items-center justify-between p-3 border-b border-border">
            <h1 className="text-lg font-semibold">
              {activeView === 'chat' && currentSession 
                ? currentSession.name 
                : activeView === 'market'
                ? '模型市场'
                : activeView === 'editor'
                ? '模型编辑器'
                : activeView === 'workflow'
                ? '工作流构建器'
                : activeView === 'agent-manager'
                ? '模型管理'
                : '设置'}
            </h1>
          </header>
        )}
        
        {/* 主内容区域 */}
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
      </main>
      
      {/* 新建会话对话框 */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新会话</DialogTitle>
            <DialogDescription>
              选择智能体类型，开始一个新的对话。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {[
              { id: 'gpt-4', name: '通用助手', description: '可以回答各种问题的AI助手' },
              { id: 'code-assistant', name: '代码助手', description: '帮助解决编程和开发问题' },
              { id: 'creative-writer', name: '创意写作', description: '协助写作和内容创作' },
              { id: 'math-solver', name: '数学助手', description: '解答数学问题和计算' }
            ].map(agent => (
              <div 
                key={agent.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
                onClick={() => createNewSession(agent.id, agent.name)}
              >
                <Avatar>
                  <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workspace; 