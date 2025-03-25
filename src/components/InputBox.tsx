import React, { useRef, useState, useEffect } from 'react'
import { SessionType, createMessage } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import * as atoms from '@/stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import * as sessionActions from '@/stores/sessionActions'
import {
    SendHorizontal,
    Settings2,
    AlertCircle,
    RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import icon from '@/static/icon.png'
import { trackingEvent } from '@/packages/event'
import MiniButton from './MiniButton'
import _ from 'lodash'
import { clearSessionData } from '@/utils/clearCache'
import { Button } from './ui/button'

export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

export default function InputBox(props: Props) {
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const [hasError, setHasError] = useState(false)
    const inputRef = useRef<HTMLTextAreaElement | null>(null)

    // 检查传入的会话ID是否有效
    useEffect(() => {
        try {
            // 验证sessionId是否有效
            const isValid = props.currentSessionId && props.currentSessionId.length > 0
            setHasError(!isValid)
        } catch (e) {
            console.error("Error validating session ID:", e)
            setHasError(true)
        }
    }, [props.currentSessionId])

    const handleSubmit = (needGenerating = true) => {
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        sessionActions.submitNewUserMessage({
            currentSessionId: props.currentSessionId,
            newUserMsg: newMessage,
            needGenerating,
        })
        setMessageInput('')
        trackingEvent('send_message', { event_category: 'user' })
    }

    // 清理会话数据并刷新页面
    const handleClearSessionData = async () => {
        await clearSessionData()
        window.location.reload()
    }

    const minTextareaHeight = 66
    const maxTextareaHeight = 96

    const onMessageInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = event.target.value
        setMessageInput(input)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (
            event.keyCode === 13 &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        ) {
            event.preventDefault()
            handleSubmit()
            return
        }
        if (event.keyCode === 13 && event.ctrlKey) {
            event.preventDefault()
            handleSubmit(false)
            return
        }
    }

    const [easterEgg, setEasterEgg] = useState(false)

    // 如果出现错误，显示错误UI
    if (hasError) {
        return (
            <div className='pl-2 pr-4 border-t border-border'>
                <div className={cn('w-full mx-auto flex flex-col p-2')}>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-2 text-red-500">
                            <AlertCircle className="mr-2 h-5 w-5" />
                            <span className="font-medium">会话功能暂不可用</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                            由于会话数据访问出错，当前输入功能已被禁用。您可以清理会话数据并刷新页面以恢复功能。
                        </p>
                        <Button 
                            onClick={handleClearSessionData} 
                            variant="default"
                            size="sm"
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            清理并刷新
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='pl-2 pr-4 border-t border-border'>
            <div className={cn('w-full mx-auto flex flex-col')}>
                <div className='flex flex-row flex-nowrap justify-between py-1'>
                    <div className='flex flex-row items-center'>
                        <MiniButton className='mr-2 hover:bg-transparent text-foreground'
                            onClick={() => {
                                setEasterEgg(true)
                                setTimeout(() => setEasterEgg(false), 1000)
                            }}
                        >
                            <img className={cn('w-5 h-5', easterEgg ? 'animate-spin' : '')} src={icon} />
                        </MiniButton>
                        <MiniButton className='mr-2 text-foreground'
                            onClick={() => setChatConfigDialogSession(sessionActions.getCurrentSession())}
                            tooltipTitle={
                                <div className='text-center inline-block'>
                                    <span>{t('Customize settings for the current conversation')}</span>
                                </div>
                            }
                            tooltipPlacement='top'
                        >
                            <Settings2 size='22' strokeWidth={1} />
                        </MiniButton>
                    </div>
                    <div className='flex flex-row items-center'>
                        <MiniButton className='w-8 ml-2 bg-primary text-primary-foreground'
                            tooltipTitle={
                                <p className="text-xs">
                                    {t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                                </p>
                            }
                            tooltipPlacement='top'
                            onClick={() => handleSubmit()}
                        >
                            <SendHorizontal size='22' strokeWidth={1} />
                        </MiniButton>
                    </div>
                </div>
                <div className='w-full pl-1 pb-2'>
                    <textarea
                        className={cn(
                            `w-full max-h-[${maxTextareaHeight}px]`,
                            'overflow-y resize-none border-none outline-none',
                            'bg-transparent p-1 text-foreground'
                        )}
                        value={messageInput} onChange={onMessageInput}
                        onKeyDown={onKeyDown}
                        ref={inputRef}
                        style={{
                            height: 'auto',
                            minHeight: minTextareaHeight + 'px',
                        }}
                        placeholder={t('Type your question here...') || ''}
                    />
                    <div className='flex flex-row items-center'>
                    </div>
                </div>
            </div>
        </div>
    )
}
