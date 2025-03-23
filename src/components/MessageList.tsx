import { useEffect, useRef, useState } from 'react'
import Message from './Message'
import * as atoms from '@/stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import { AlertTriangle, MessageSquare } from 'lucide-react'
import { Button } from './ui/button'
import { clearSessionData } from '@/utils/clearCache'
import { Message as MessageType, Session, SessionType } from '@/shared/types'

interface Props { }

export default function MessageList(props: Props) {
    const [hasError, setHasError] = useState(false)
    const ref = useRef<HTMLDivElement | null>(null)
    const [, setMessageListRef] = useAtom(atoms.messageListRefAtom)
    
    // 使用try-catch包裹状态访问，防止错误导致整个组件崩溃
    let currentSession: Session | undefined = undefined;
    let currentMessageList: MessageType[] = [];
    
    try {
        // 获取当前会话和消息列表
        currentSession = useAtomValue(atoms.currentSessionAtom)
        currentMessageList = useAtomValue(atoms.currentMessageListAtom)
        
        // 验证会话数据
        if (!currentSession || !currentSession.id || !Array.isArray(currentMessageList)) {
            throw new Error('Invalid session or message data')
        }
    } catch (e) {
        console.error('Error accessing session data in MessageList:', e)
        setHasError(true)
    }
    
    // 处理清除会话数据
    const handleClearSessionData = async () => {
        try {
            await clearSessionData()
            window.location.reload()
        } catch (e) {
            console.error('Failed to clear session data:', e)
        }
    }
    
    useEffect(() => {
        setMessageListRef(ref)
    }, [ref, setMessageListRef])
    
    // 错误状态UI
    if (hasError) {
        return (
            <div className='overflow-y-auto w-full h-full flex flex-col items-center justify-center' ref={ref}>
                <div className="max-w-md p-6 bg-muted/50 rounded-lg text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
                    <h3 className="text-lg font-medium mb-2">无法加载消息</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        应用无法正确加载会话数据，这可能是由于数据损坏或访问权限问题导致的。
                    </p>
                    <Button 
                        onClick={handleClearSessionData}
                        variant="default"
                        className="w-full"
                    >
                        清理会话数据并刷新
                    </Button>
                </div>
            </div>
        )
    }
    
    // 空消息列表状态
    if (!currentMessageList || currentMessageList.length === 0) {
        return (
            <div className='overflow-y-auto w-full h-full flex flex-col items-center justify-center' ref={ref}>
                <div className="text-center opacity-70">
                    <MessageSquare className="mx-auto mb-3 h-12 w-12" strokeWidth={1} />
                    <p className="text-lg">开始新的对话</p>
                    <p className="text-sm text-muted-foreground">
                        在下方输入框中输入问题，开始与AI助手对话
                    </p>
                </div>
            </div>
        )
    }
    
    // 确保会话数据存在（应该都通过了上面的检查，这里是类型安全检查）
    if (!currentSession) {
        return null;
    }
    
    // 正常渲染
    return (
        <div className='overflow-y-auto w-full h-full pr-0 pl-0' ref={ref}>
            {
                currentMessageList.map((msg, index) => (
                    <Message
                        id={msg.id}
                        key={'msg-' + msg.id}
                        msg={msg}
                        sessionId={currentSession.id}
                        sessionType={(currentSession.type || 'chat') as SessionType}
                        className={index === 0 ? 'pt-4' : ''}
                        collapseThreshold={msg.role === 'system' ? 150 : undefined}
                    />
                ))
            }
        </div>
    )
} 