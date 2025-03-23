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
        return window.location.search.includes('newui=1') || localStorage.getItem('force_new_ui') === 'true';
    });

    // 显示新界面条件
    const shouldShowNewUI = forceNewUI && !showLegacyUI;

    return (
        <div className="box-border App" spellCheck={spellCheck}>
            {shouldShowNewUI ? (
                <div className="h-full">
                    <Workspace />
                    <button 
                        className="fixed bottom-4 right-4 px-4 py-2 bg-muted text-muted-foreground rounded-md text-xs opacity-30 hover:opacity-100 transition-opacity"
                        onClick={() => setShowLegacyUI(true)}
                    >
                        切换到旧界面
                    </button>
                </div>
            ) : (
                <>
                    <div className="h-full flex">
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
                            <MainPane sidebarVisible={sidebarVisible} />
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
                
                initializeTauriEvents();
                
                if (typeof window.__clearAllCache !== 'function') {
                    try {
                        const cacheModule = await import('./utils/clearCache');
                        window.__clearAllCache = cacheModule.clearAllCache;
                        window.__clearSessionData = cacheModule.clearSessionData;
                        console.log('Cache clearing functions initialized');
                    } catch (e) {
                        console.warn('Failed to initialize cache clearing functions:', e);
                    }
                }
                
                try {
                    await tauriBridge.getStoreValue("test-init");
                } catch (e) {
                    console.warn("Store initialization test failed:", e);
                }
                
                setInitialized(true);
            } catch (error) {
                console.error('Failed to initialize Tauri events:', error);
                setInitialized(true);
            }
        };
        
        initialize();
    }, [setSessions]);

    if (!initialized) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div>Initializing application...</div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
                <Main />
            </ThemeProvider>
        </ErrorBoundary>
    )
}
