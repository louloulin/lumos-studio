import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Message, SessionType } from '@/shared/types'
import { useAtomValue, useSetAtom } from 'jotai'
import {
    showMessageTimestampAtom,
    showModelNameAtom,
    showTokenCountAtom,
    showWordCountAtom,
    openSettingDialogAtom,
    enableMarkdownRenderingAtom,
} from '@/stores/atoms'
import { currsentSessionPicUrlAtom, showTokenUsedAtom } from '@/stores/atoms'
import * as scrollActions from '@/stores/scrollActions'
import Markdown from '@/components/Markdown'
import '../static/Block.css'
import MessageErrTips from './MessageErrTips'
import * as dateFns from "date-fns"
import { cn } from '@/lib/utils'
import { estimateTokensFromMessages } from '@/packages/token'
import { countWord } from '@/packages/word-count'

// 引入 shadcn/ui 组件
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, Bot } from "lucide-react"

export interface Props {
    id?: string
    sessionId: string
    sessionType: SessionType
    msg: Message
    className?: string
    collapseThreshold?: number
    hiddenButtonGroup?: boolean
    small?: boolean
}

export default function MessageComponent(props: Props) {
    const { t } = useTranslation()

    const showMessageTimestamp = useAtomValue(showMessageTimestampAtom)
    const showModelName = useAtomValue(showModelNameAtom)
    const showTokenCount = useAtomValue(showTokenCountAtom)
    const showWordCount = useAtomValue(showWordCountAtom)
    const showTokenUsed = useAtomValue(showTokenUsedAtom)
    const enableMarkdownRendering = useAtomValue(enableMarkdownRenderingAtom)
    const currentSessionPicUrl = useAtomValue(currsentSessionPicUrlAtom)
    const setOpenSettingWindow = useSetAtom(openSettingDialogAtom)

    const { msg, className, collapseThreshold, hiddenButtonGroup, small } = props

    const needCollapse = collapseThreshold
        && (JSON.stringify(msg.content)).length > collapseThreshold
        && (JSON.stringify(msg.content)).length - collapseThreshold > 50
    const [isCollapsed, setIsCollapsed] = useState(needCollapse)

    const ref = useRef<HTMLDivElement>(null)

    const tips: string[] = []
    if (props.sessionType === 'chat' || !props.sessionType) {
        if (showWordCount && !msg.generating) {
            tips.push(`word count: ${msg.wordCount !== undefined ? msg.wordCount : countWord(msg.content)}`)
        }
        if (showTokenCount && !msg.generating) {
            if (msg.tokenCount === undefined) {
                msg.tokenCount = estimateTokensFromMessages([msg])
            }
            tips.push(`token count: ${msg.tokenCount}`)
        }
        if (showTokenUsed && msg.role === 'assistant' && !msg.generating) {
            tips.push(`tokens used: ${msg.tokensUsed || 'unknown'}`)
        }
        if (showModelName && props.msg.role === 'assistant') {
            tips.push(`model: ${props.msg.model || 'unknown'}`)
        }
    }

    if (showMessageTimestamp && msg.timestamp !== undefined) {
        let date = new Date(msg.timestamp)
        let messageTimestamp: string
        if (dateFns.isToday(date)) {
            messageTimestamp = dateFns.format(date, 'HH:mm')
        } else if (dateFns.isThisYear(date)) {
            messageTimestamp = dateFns.format(date, 'MM-dd HH:mm')
        } else {
            messageTimestamp = dateFns.format(date, 'yyyy-MM-dd HH:mm')
        }

        tips.push('time: ' + messageTimestamp)
    }

    useEffect(() => {
        if (msg.generating) {
            scrollActions.scrollToBottom()
        }
    }, [msg.content])

    let content = msg.content
    if (typeof msg.content !== 'string') {
        content = JSON.stringify(msg.content)
    }
    if (msg.generating) {
        content += '...'
    }
    if (needCollapse && isCollapsed) {
        content = msg.content.slice(0, collapseThreshold) + '... '
    }

    const CollapseButton = (
        <span
            className='cursor-pointer inline-block font-bold text-blue-500 hover:text-white hover:bg-blue-500'
            onClick={() => setIsCollapsed(!isCollapsed)}
        >
            [{isCollapsed ? t('Expand') : t('Collapse')}]
        </span>
    )

    return (
        <div
            ref={ref}
            id={props.id}
            key={msg.id}
            className={cn(
                'group/message',
                'msg-block',
                'px-4 sm:px-6',
                'pb-0.1',
                msg.generating ? 'rendering' : 'render-done',
                {
                    'user-msg': msg.role === 'user',
                    'system-msg': msg.role === 'system',
                    'assistant-msg': msg.role === 'assistant'
                },
                className
            )}
        >
            <div className="flex gap-4 flex-nowrap">
                <div className="mt-2">
                    {msg.role === 'assistant' && (
                        currentSessionPicUrl ? (
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={currentSessionPicUrl} />
                                <AvatarFallback>
                                    <Bot className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <Avatar className="h-7 w-7 bg-primary">
                                <AvatarFallback>
                                    <Bot className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                        )
                    )}
                    {msg.role === 'user' && (
                        <Avatar
                            className="h-7 w-7 cursor-pointer"
                            onClick={() => setOpenSettingWindow('chat')}
                        >
                            <AvatarFallback>
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                    {msg.role === 'system' && (
                        <Avatar className="h-7 w-7 bg-warning">
                            <AvatarFallback>
                                <Settings className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
                <div className="flex-1 w-0 pr-4">
                    <div 
                        className={cn('msg-content', { 'msg-content-small': small })}
                        style={small ? { fontSize: '0.875rem' } : {}}
                    >
                        {
                            enableMarkdownRendering && !isCollapsed ? (
                                <Markdown>
                                    {content}
                                </Markdown>
                            ) : (
                                <div>
                                    {content}
                                    {
                                        needCollapse && isCollapsed && (
                                            CollapseButton
                                        )
                                    }
                                </div>
                            )
                        }
                    </div>
                    <MessageErrTips msg={msg} />
                    {
                        needCollapse && !isCollapsed && CollapseButton
                    }
                    <p className="text-sm opacity-50 pb-8">
                        {tips.join(', ')}
                    </p>
                </div>
            </div>
        </div>
    )
}
