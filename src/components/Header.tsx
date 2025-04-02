import { useEffect } from 'react'
import * as atoms from '@/stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import * as sessionActions from '@/stores/sessionActions'
import Toolbar from './Toolbar'
import { cn } from '@/lib/utils'
import { getAutoGenerateTitle } from '@/stores/settingActions'
import { Button } from './ui/button'
import { Layout } from 'lucide-react'
import { ThemeToggle } from './ui/theme-toggle'

interface Props { 
    onSwitchToNewUI?: () => void;
}

export default function Header(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)

    useEffect(() => {
        const autoGenerateTitle : boolean = getAutoGenerateTitle()
        if (
            autoGenerateTitle &&
            currentSession.name === 'Untitled'
            && currentSession.messages.length >= 2
        ) {
            sessionActions.generateName(currentSession.id)
            return 
        }
    }, [currentSession.messages.length])

    const editCurrentSession = () => {
        setChatConfigDialogSession(currentSession)
    }

    // 切换到新UI界面的处理函数
    const handleSwitchToNewUI = () => {
        try {
            // 先设置localStorage
            localStorage.setItem('force_new_ui', 'true');
            console.log("切换到新界面 - localStorage已设置");
            
            // 强制添加一个查询参数，保证会刷新且使用新UI
            const newUrl = window.location.pathname + "?newui=true&t=" + Date.now();
            console.log("切换到新界面 - 即将跳转到:", newUrl);
            window.location.href = newUrl;
        } catch (e) {
            console.error("切换界面出错:", e);
            alert("切换界面失败，请刷新页面重试");
        }
    };

    return (
        <div
            className="pt-3 pb-2 px-4 border-b border-border"
        >
            <div className={cn('w-full mx-auto flex flex-row')}>
                <div
                    className="flex-1 overflow-hidden text-ellipsis flex items-center cursor-pointer"
                    onClick={() => {
                        editCurrentSession()
                    }}
                >
                    <h2 className="text-xl font-semibold truncate max-w-56 ml-3">
                        {currentSession.name}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button 
                        variant="outline" 
                        className="text-sm flex items-center" 
                        onClick={handleSwitchToNewUI}
                    >
                        <Layout className="mr-1 h-4 w-4" />
                        切换到新界面
                    </Button>
                    <Toolbar />
                </div>
            </div>
        </div>
    )
}
