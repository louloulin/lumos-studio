import React, { useEffect } from 'react'
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
import { useAtom, useAtomValue } from 'jotai'
import * as atoms from './stores/atoms'
import Sidebar from './Sidebar'
import * as premiumActions from './stores/premiumActions'
import { tauriBridge, initializeTauriEvents } from './tauri-bridge'
import platform from './packages/platform'
import { ThemeProvider } from './components/ui/theme-provider'
import ShadcnTest from './components/ShadcnTest'

// The Window interface is now defined in window.d.ts

function Main() {
    const spellCheck = useAtomValue(atoms.spellCheckAtom)
    const [openSettingWindow, setOpenSettingWindow] = useAtom(atoms.openSettingDialogAtom)
    const [openAboutWindow, setOpenAboutWindow] = React.useState(false)
    const [openCopilotWindow, setOpenCopilotWindow] = React.useState(false)
    const [showShadcnTest, setShowShadcnTest] = React.useState(false)

    return (
        <div className="box-border App" spellCheck={spellCheck}>
            {showShadcnTest ? (
                <div className="h-full flex flex-col">
                    <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
                        <h1 className="text-xl font-bold">Shadcn UI 测试</h1>
                        <button 
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
                            onClick={() => setShowShadcnTest(false)}
                        >
                            返回应用
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <ShadcnTest />
                    </div>
                </div>
            ) : (
                <>
                    <div className="h-full flex">
                        <Sidebar
                            openCopilotWindow={() => setOpenCopilotWindow(true)}
                            openAboutWindow={() => setOpenAboutWindow(true)}
                            setOpenSettingWindow={setOpenSettingWindow}
                            openShadcnTest={() => setShowShadcnTest(true)}
                        />
                        <MainPane />
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

    useEffect(() => {
        const initialize = async () => {
            try {
                // Expose the Tauri bridge to the window object
                if (!window.tauriAPI) {
                    window.tauriAPI = tauriBridge;
                }
                
                // Initialize the platform with tauriAPI
                if (platform.tauriAPI !== tauriBridge) {
                    platform.tauriAPI = tauriBridge;
                }
                
                // Initialize tauri events using our improved function
                initializeTauriEvents();
                
                // Initialize store and test store operations
                try {
                    await tauriBridge.getStoreValue("test-init");
                } catch (e) {
                    console.warn("Store initialization test failed:", e);
                }
                
                setInitialized(true);
            } catch (error) {
                console.error('Failed to initialize Tauri events:', error);
                // Set initialized even if there was an error to avoid frozen UI
                setInitialized(true);
            }
        };
        
        initialize();
    }, []);

    // Show loading indicator if not initialized
    if (!initialized) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div>Initializing application...</div>
            </div>
        );
    }

    return (
        <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
            <Main />
        </ThemeProvider>
    )
}
