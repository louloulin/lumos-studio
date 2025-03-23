import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import icon from './static/icon.png'
import useVersion from './hooks/useVersion'
import SessionList from './components/SessionList'
import * as sessionActions from './stores/sessionActions'
import { useSetAtom } from 'jotai'
import * as atoms from './stores/atoms'
import { trackingEvent } from './packages/event'
import { cn } from './lib/utils'
import { Button } from './components/ui/button'
import { 
    Menu, 
    Settings, 
    Plus, 
    Trash2, 
    Info, 
    Bot, 
    ImageIcon,
    Github as GithubIcon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import platform from './packages/platform'
import { useAtom } from "jotai"
import { sessionsAtom } from "./stores/atoms"
import { create } from "./stores/sessionActions"

export const drawerWidth = 240

interface Props {
    openCopilotWindow(): void
    openAboutWindow(): void
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
    openShadcnTest?(): void
    onToggleVisibility?(visible: boolean): void
}

export default function Sidebar(props: Props) {
    const sessionListRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()
    const [sessions, setSessions] = useAtom(sessionsAtom)
    const versionHook = useVersion()
    const [isVisible, setIsVisible] = useState(true)

    // 切换侧边栏可见性
    const toggleSidebarVisibility = () => {
        const newVisibility = !isVisible;
        setIsVisible(newVisibility);
        if (props.onToggleVisibility) {
            props.onToggleVisibility(newVisibility);
        }
    }

    // 初始化时通知父组件侧边栏状态
    useEffect(() => {
        if (props.onToggleVisibility) {
            props.onToggleVisibility(isVisible);
        }
    }, []);

    const handleCreateNewSession = () => {
        sessionActions.createEmpty('chat');
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0);
        }
        trackingEvent('create_new_conversation', { event_category: 'user' });
    }

    return (
        <div
            className={`fixed top-0 left-0 h-full z-50 w-60 border-r border-border transition-all duration-300 ${
                isVisible ? '' : '-translate-x-full'
            }`}
        >
            <div className="h-full">
                <div className="flex flex-col h-full pt-3 pl-2 pr-1">
                    <div className="flex justify-between items-center px-2">
                        <a
                            href="https://github.com/louloulinux/lumos-studio"
                            target="_blank"
                            className="flex items-center no-underline"
                        >
                            <img src={icon} className="w-8 h-8 mr-3" />
                            <div className="flex flex-col items-start">
                                <span className="text-2xl font-medium">Lumos</span>
                                <span className="text-[10px] opacity-50">Studio</span>
                            </div>
                        </a>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleSidebarVisibility}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-grow mt-4 overflow-hidden">
                        <div className="flex flex-col flex-1 h-full overflow-auto hide-scrollbar" ref={sessionListRef}>
                            <SessionList sessionListRef={sessionListRef} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 p-2 pt-2 border-t border-border">
                        <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={handleCreateNewSession}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('create_new_chat')}
                        </Button>
                        <div className="grid grid-cols-4 gap-2">
                            <Button variant="outline" size="icon" onClick={() => props.openAboutWindow()}>
                                <Info className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => props.setOpenSettingWindow('ai')}>
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => props.openCopilotWindow()}>
                                <Bot className="h-4 w-4" />
                            </Button>
                            {props.openShadcnTest && (
                                <Button variant="outline" size="icon" onClick={props.openShadcnTest}>
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="text-xs text-center mt-1 text-muted-foreground">
                            Version: {versionHook.version}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 侧边栏切换按钮（当侧边栏隐藏时显示） */}
            {!isVisible && (
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={toggleSidebarVisibility}
                    className="absolute top-4 right-0 translate-x-full rounded-l-none"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
