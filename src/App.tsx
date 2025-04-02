import React, { useEffect, useState } from 'react'
import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './components/Toasts'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import useAppTheme from './hooks/useAppTheme'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import * as atoms from './stores/atoms'
import * as premiumActions from './stores/premiumActions'
import { tauriBridge, initializeTauriEvents } from './tauri-bridge'
import platform from './packages/platform'
import { ThemeProvider } from './components/ui/theme-provider'
import Workspace from './components/Workspace'
import * as defaults from './shared/defaults'
import ErrorBoundary from './components/ErrorBoundary'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom'
import WhiteboardPage from './pages/WhiteboardPage'
import HomePage from './pages/HomePage'
import AgentsPage from './pages/AgentsPage'
import AgentCreationPage from './pages/AgentCreationPage'
import AgentMarketPage from './pages/AgentMarketPage'
import WorkflowListPage from './pages/WorkflowListPage'
import WorkflowEditorPage from './pages/WorkflowEditorPage'
import WorkflowRunPage from './pages/WorkflowRunPage'
import ToolsPage from './pages/ToolsPage'
import ToolEditorPage from './pages/ToolEditorPage'
import ToolTestPage from './pages/ToolTestPage'
import WorkflowPage from './pages/WorkflowPage'
import PluginMarketPage from './pages/PluginMarketPage'

// The Window interface is now defined in window.d.ts

function Main() {
    const spellCheck = useAtomValue(atoms.spellCheckAtom)
    // Get the current route/page from URL
    const [currentPage, setCurrentPage] = useState(() => {
        const path = window.location.pathname;
        if (path.includes('/chat')) return 'chat';
        if (path.includes('/agents')) return 'agents';
        if (path.includes('/whiteboard')) return 'whiteboard';
        if (path.includes('/workflow')) return 'workflow';
        if (path.includes('/tools')) return 'tools';
        return 'home';
    });
    
    // Listen for route changes
    useEffect(() => {
        const handleRouteChange = () => {
            const path = window.location.pathname;
            if (path.includes('/chat')) setCurrentPage('chat');
            else if (path.includes('/agents')) setCurrentPage('agents');
            else if (path.includes('/whiteboard')) setCurrentPage('whiteboard');
            else if (path.includes('/workflow')) setCurrentPage('workflow');
            else if (path.includes('/tools')) setCurrentPage('tools');
            else setCurrentPage('home');
        };
        
        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    return (
        <div className="box-border App w-full h-full" spellCheck={spellCheck}>
            <div className="h-full w-full">
                <Workspace currentPage={currentPage} />
            </div>
            <Toasts />
        </div>
    )
}

// 创建一个单独的组件来处理路由重定向
function WorkflowNewRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('WorkflowNewRedirect: 重定向到工作流编辑器页面');
    // 直接重定向到工作流编辑器页面
    navigate('/workflow/editor/new', { replace: true });
  }, [navigate]);
  
  return <div>正在跳转到工作流编辑器...</div>;
}

export default function App() {
    useI18nEffect()
    premiumActions.useAutoValidate()
    useSystemLanguageWhenInit()
    const theme = useAppTheme()
    const [initialized, setInitialized] = React.useState(false);
    const setSessions = useSetAtom(atoms.sessionsAtom);

    useEffect(() => {
        const initialize = async () => {
            try {
                const shouldUseDefaults = localStorage.getItem('_force_use_defaults') === 'true';
                if (shouldUseDefaults) {
                    console.log('Force using default sessions after cache cleaning');
                    setSessions(defaults.sessions());
                    localStorage.removeItem('_force_use_defaults');
                }
                
                if (!window.tauriAPI) {
                    window.tauriAPI = tauriBridge;
                }
                
                if (platform.tauriAPI !== tauriBridge) {
                    platform.tauriAPI = tauriBridge;
                }
                
                try {
                    // 使用非阻塞方式初始化Tauri事件，即使失败也继续执行后续步骤
                    initializeTauriEvents().catch(error => {
                        console.error('Failed to initialize Tauri events (non-blocking):', error);
                    });
                } catch (error) {
                    console.error('Failed to initialize Tauri events:', error);
                }
                
                if (typeof window.__clearAllCache !== 'function') {
                    try {
                        // 导入注册模块，自动注册清理函数到window
                        await import('./utils/registerCacheClearFunctions');
                    } catch (e) {
                        console.warn('Failed to register cache clearing functions:', e);
                    }
                }
                
                try {
                    // 运行函数但不使用返回值
                    await tauriBridge.getStoreValue("test-init");
                } catch (e) {
                    console.warn("Store initialization test failed:", e);
                }
                
                setInitialized(true);
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setInitialized(true);
            }
        };
        
        initialize().catch(error => {
            console.error('Initialization failed:', error);
            setInitialized(true);
        });
    }, [setSessions]);

    if (!initialized) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <div>Initializing application...</div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
                <div className="w-full h-full overflow-hidden tauri-window-container">
                    <Router>
                        <Routes>
                            <Route path="/" element={<Main />} />
                            <Route path="/whiteboard" element={<Main />} />
                            <Route path="/chat" element={<Main />} />
                            <Route path="/agents" element={<Main />} />
                            <Route path="/agents/create" element={<AgentCreationPage />} />
                            <Route path="/agents/market" element={<AgentMarketPage />} />
                            <Route path="/tools" element={<ToolsPage />} />
                            <Route path="/tools/new" element={<ToolEditorPage />} />
                            <Route path="/tools/test/:id" element={<ToolTestPage />} />
                            <Route path="/tools/:id" element={<ToolEditorPage />} />
                            <Route path="/workflow" element={<WorkflowListPage />} />
                            <Route path="/workflow/new" element={<WorkflowEditorPage />} />
                            <Route path="/workflow/editor/new" element={<WorkflowEditorPage />} />
                            <Route path="/workflow/run/:id" element={<WorkflowRunPage />} />
                            <Route path="/workflow/:id" element={<WorkflowEditorPage />} />
                            <Route path="/plugins/market" element={<PluginMarketPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Router>
                </div>
            </ThemeProvider>
        </ErrorBoundary>
    )
}
