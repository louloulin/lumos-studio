import { useRef } from 'react'
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
    Github as GithubIcon
} from 'lucide-react'
import platform from '@/packages/platform'
import { useAtom } from "jotai"
import { sessionsAtom } from "@/stores/atoms"
import { useSettingStore } from "@/stores/settings"
import { useHistoryStore } from "@/stores/history"
import { create } from "@/stores/sessionActions"

export const drawerWidth = 240

interface Props {
    openCopilotWindow(): void
    openAboutWindow(): void
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
    openShadcnTest?(): void
}

export default function Sidebar(props: Props) {
    const sessionListRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()
    const [sessions, setSessions] = useAtom(sessionsAtom)
    const versionHook = useVersion()

    const handleCreateNewSession = () => {
        const session = create('chat')
        setSessions([session, ...sessions])
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0)
        }
        trackingEvent('create_new_conversation', { event_category: 'user' })
    }

    return (
        <div
            className="fixed top-0 left-0 h-full z-50 w-60 border-r border-border"
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
                    </div>

                    <SessionList sessionListRef={sessionListRef} />

                    <div className="w-full h-px bg-border my-2"></div>

                    <nav className="mb-5 space-y-1">
                        <button 
                            onClick={handleCreateNewSession}
                            className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-secondary"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="flex-1">{t('new chat')}</span>
                        </button>

                        <button
                            onClick={props.openCopilotWindow}
                            className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-secondary"
                        >
                            <Bot className="h-4 w-4 mr-2" />
                            <span className="flex-1 font-medium">{t('AI Copilot')}</span>
                        </button>

                        <button
                            onClick={() => props.setOpenSettingWindow('ai')}
                            className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-secondary"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            <span className="flex-1">{t('settings')}</span>
                        </button>

                        <button
                            onClick={props.openAboutWindow}
                            className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-secondary"
                        >
                            <Info className="h-4 w-4 mr-2" />
                            <span className="flex-1">{t('about')}</span>
                        </button>

                        {props.openShadcnTest && (
                            <button
                                onClick={props.openShadcnTest}
                                className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-secondary"
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                <span className="flex-1">UI Test</span>
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    )
}
