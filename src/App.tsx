import React, { useEffect, useState } from 'react'
import SettingDialog from './pages/SettingDialog'
import ChatConfigWindow from './pages/ChatConfigWindow'
import CleanWidnow from './pages/CleanWindow'
import AboutWindow from './pages/AboutWindow'
import useAppTheme from './hooks/useAppTheme'
import CopilotWindow from './pages/CopilotWindow'
import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './components/Toasts'
import RemoteDialogWindow from './pages/RemoteDialogWindow'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import MainPane from './MainPane'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import * as atoms from './stores/atoms'
import Sidebar from './Sidebar'
import * as premiumActions from './stores/premiumActions'
import { tauriBridge, initializeTauriEvents } from './tauri-bridge'
import platform from './packages/platform'
import { ThemeProvider } from './components/ui/theme-provider'
import Workspace from './components/Workspace'
import * as defaults from './shared/defaults'
import ErrorBoundary from './components/ErrorBoundary'
import { TauriAPI } from './shared/tauri-types'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import WhiteboardPage from './pages/WhiteboardPage'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import AgentsPage from './pages/AgentsPage'

// The Window interface is now defined in window.d.ts

function Main() {
    const spellCheck = useAtomValue(atoms.spellCheckAtom)
    const [openSettingWindow, setOpenSettingWindow] = useAtom(atoms.openSettingDialogAtom)
    const [openAboutWindow, setOpenAboutWindow] = React.useState(false)
    const [openCopilotWindow, setOpenCopilotWindow] = React.useState(false)
    const [showLegacyUI, setShowLegacyUI] = React.useState(false)
    const [sidebarVisible, setSidebarVisible] = useState(true)
    const currentSession = useAtomValue(atoms.currentSessionAtom);

    // 开发模式下，可以通过URL参数强制显示新UI
    const [forceNewUI] = useState(() => {
        // 检查URL参数或localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const hasNewUIParam = urlParams.has('newui');
        const newUIValue = urlParams.get('newui');
        
        // 如果URL中有newui参数
        if (hasNewUIParam) {
            const shouldForce = newUIValue === '1' || newUIValue === 'true';
            // 存储到localStorage以便持久化
            localStorage.setItem('force_new_ui', shouldForce ? 'true' : 'false');
            return shouldForce;
        }
        
        // 否则从localStorage读取
        return localStorage.getItem('force_new_ui') === 'true';
    });

    // 显示新界面条件
    const shouldShowNewUI = forceNewUI && !showLegacyUI;

    // 切换回传统UI并清除hash
    const switchToLegacyUI = () => {
        // 更新状态
        setShowLegacyUI(true);
        
        // 确保localStorage中的标志也被重置
        localStorage.setItem('force_new_ui', 'false');
        
        // 清除hash
        if (window.location.hash) {
            // 清除hash但不刷新页面
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        
        // 可选：刷新页面以确保状态完全重置
        // window.location.reload();
    };

    return (
        <div className="box-border App w-full h-full" spellCheck={spellCheck}>
            {shouldShowNewUI ? (
                <div className="h-full w-full">
                    <Workspace />
                </div>
            ) : (
                <>
                    <div className="h-full w-full flex">
                        <ErrorBoundary>
                            <Sidebar
                                openCopilotWindow={() => setOpenCopilotWindow(true)}
                                openAboutWindow={() => setOpenAboutWindow(true)}
                                setOpenSettingWindow={setOpenSettingWindow}
                                openShadcnTest={() => setShowLegacyUI(false)}
                                onToggleVisibility={(visible) => setSidebarVisible(visible)}
                            />
                        </ErrorBoundary>
                        <ErrorBoundary>
                            <MainPane 
                                sidebarVisible={sidebarVisible} 
                                onSwitchToNewUI={() => setShowLegacyUI(false)}
                            />
                        </ErrorBoundary>
                    </div>
                    <SettingDialog
                        open={!!openSettingWindow}
                        targetTab={openSettingWindow || undefined}
                        close={() => setOpenSettingWindow(null)}
                    />
                    <AboutWindow open={openAboutWindow} close={() => setOpenAboutWindow(false)} />
                    <ChatConfigWindow />
                    <CleanWidnow />
                    <CopilotWindow open={openCopilotWindow} close={() => setOpenCopilotWindow(false)} />
                    <RemoteDialogWindow />
                </>
            )}
            <Toasts />
        </div>
    )
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
                    // 运行函数但不使用返回值
                    initializeTauriEvents();
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
                            <Route path="/" element={<HomePage />} />
                            <Route path="/whiteboard" element={<WhiteboardPage />} />
                            <Route path="/chat" element={<ChatPage />} />
                            <Route path="/agents" element={<AgentsPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Router>
                </div>
            </ThemeProvider>
        </ErrorBoundary>
    )
}
