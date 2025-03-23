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
    Plus, 
    Settings, 
    Info, 
    Bot, 
    ImageIcon
} from 'lucide-react'

export const drawerWidth = 240

interface Props {
    openCopilotWindow(): void
    openAboutWindow(): void
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
    openShadcnTest?(): void
}

export default function Sidebar(props: Props) {
    const { t } = useTranslation()
    const versionHook = useVersion()

    const sessionListRef = useRef<HTMLDivElement>(null)
    const handleCreateNewSession = () => {
        sessionActions.createEmpty('chat')
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
                            href="https://github.com/Bin-Huang/chatbox"
                            target="_blank"
                            className="flex items-center no-underline"
                        >
                            <img src={icon} className="w-8 h-8 mr-3" />
                            <div className="flex flex-col items-start">
                                <span className="text-2xl font-medium">Chatbox</span>
                                <span className="text-[10px] opacity-50">Community Edition</span>
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
                            <div className="flex-1 flex items-center">
                                <span className="opacity-50">
                                    {t('About')}
                                    {/\d/.test(versionHook.version) ? `(${versionHook.version})` : ''}
                                </span>
                                {versionHook.needCheckUpdate && (
                                    <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
                                )}
                            </div>
                        </button>

                        {props.openShadcnTest && (
                            <button
                                onClick={props.openShadcnTest}
                                className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-secondary"
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                <span className="flex-1 font-medium">Shadcn UI 测试</span>
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    )
}
