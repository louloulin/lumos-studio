import { useState, useEffect } from 'react'
import * as atoms from './stores/atoms'
import { useAtomValue } from 'jotai'
import InputBox from './components/InputBox'
import MessageList from './components/MessageList'
import { drawerWidth } from './Sidebar'
import Header from './components/Header'
import { Button } from './components/ui/button'
import { RefreshCw } from 'lucide-react'
import { Session, SessionType } from '@/shared/types'

interface Props {}

export default function MainPane(props: Props) {
    const [hasError, setHasError] = useState(false)
    const [isFallback, setIsFallback] = useState(false)
    
    let currentSession: Session;
    
    // 尝试获取当前会话，如果出错则使用默认值
    try {
        currentSession = useAtomValue(atoms.currentSessionAtom)
        
        // 验证会话数据是否有效
        if (!currentSession || !currentSession.id) {
            throw new Error("Invalid session data")
        }
        
        // 如果成功获取会话数据，重置错误状态
        useEffect(() => {
            if (hasError) {
                setHasError(false)
            }
        }, [currentSession])
    } catch (e) {
        console.error("Error accessing current session:", e)
        setHasError(true)
        // 使用符合Session类型的fallback值
        currentSession = { 
            id: 'fallback-session', 
            type: 'chat' as SessionType, 
            name: 'Default Session', 
            messages: [] 
        }
        setIsFallback(true)
    }
    
    // 重置功能，清理localStorage并刷新页面
    const handleReset = () => {
        try {
            // 清理所有相关的localStorage数据
            Object.keys(localStorage).forEach(key => {
                if (key.includes('session') || key.includes('atom') || key === 'chat-sessions') {
                    localStorage.removeItem(key)
                }
            })
            
            // 刷新页面
            window.location.reload()
        } catch (e) {
            console.error("Failed to reset application:", e)
        }
    }
    
    // 如果出现错误，显示错误UI
    if (hasError && isFallback) {
        return (
            <div 
                className="h-full w-full flex-grow flex flex-col items-center justify-center"
                style={{ marginLeft: `${drawerWidth}px` }}
            >
                <div className="text-center p-6 bg-muted rounded-lg max-w-md">
                    <h2 className="text-xl font-bold mb-2">应用数据访问错误</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        无法正确访问会话数据，这可能是由于Tauri存储数据损坏或权限问题导致的。
                    </p>
                    <Button 
                        onClick={handleReset} 
                        variant="default"
                        className="w-full"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        清理所有缓存并重启
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div 
            className="h-full w-full flex-grow"
            style={{ marginLeft: `${drawerWidth}px` }}
        >
            <div className="flex flex-col h-full">
                <Header />
                <MessageList />
                <InputBox currentSessionId={currentSession.id} currentSessionType={currentSession.type || 'chat'} />
            </div>
        </div>
    )
}
