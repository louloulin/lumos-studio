import React, { useEffect, useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import * as atoms from './stores/atoms';
import MessageList from './components/MessageList';
import InputBox from './components/InputBox';
import MastraChat from './components/MastraChat';
import { invoke } from '@tauri-apps/api/core';
import { drawerWidth } from './Sidebar';
import Header from './components/Header';
import { Button } from './components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Session, SessionType } from '@/shared/types';

interface MainPaneProps {
    sidebarVisible?: boolean;
    onSwitchToNewUI?: () => void;
}

const MainPane: React.FC<MainPaneProps> = ({ sidebarVisible = true, onSwitchToNewUI }) => {
    const [isMastraMode, setIsMastraMode] = useState(false);
    const [currentSessionId] = useAtom(atoms.currentSessionIdAtom);
    const currentSession = useAtomValue(atoms.currentSessionAtom);
    const currentMessageList = useAtomValue(atoms.currentMessageListAtom);
    const isSessionSelected = !!currentSessionId;
    const [hasError, setHasError] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    
    // 尝试获取当前会话，如果出错则使用默认值
    let safeCurrentSession: Session = currentSession || {
        id: 'fallback-session',
        type: 'chat' as SessionType,
        name: 'Default Session',
        messages: []
    };
    
    // 验证会话数据是否有效，设置错误状态
    useEffect(() => {
        try {
            if (!currentSession || !currentSession.id) {
                setHasError(true);
                setIsFallback(true);
            } else {
                setHasError(false);
                setIsFallback(false);
            }
        } catch (e) {
            console.error("Error validating session:", e);
            setHasError(true);
            setIsFallback(true);
        }
    }, [currentSession]);
    
    // 重置功能，清理localStorage并刷新页面
    const handleReset = () => {
        try {
            // 清理所有相关的localStorage数据
            Object.keys(localStorage).forEach(key => {
                if (key.includes('session') || key.includes('atom') || key === 'chat-sessions') {
                    localStorage.removeItem(key);
                }
            });
            
            // 刷新页面
            window.location.reload();
        } catch (e) {
            console.error("Failed to reset application:", e);
        }
    };
    
    // 检测是否为Tauri环境以及Mastra服务是否可用
    useEffect(() => {
        const checkMastraMode = async () => {
            try {
                // 检查是否在Tauri环境中运行
                if (typeof window.__TAURI__ !== 'undefined') {
                    // 如果是Tauri环境，检查Mastra服务是否可用
                    const isMastraAvailable = await invoke('is_mastra_available');
                    setIsMastraMode(!!isMastraAvailable);
                } else {
                    // 非Tauri环境，根据是否有特定查询参数决定是否使用Mastra
                    const urlParams = new URLSearchParams(window.location.search);
                    setIsMastraMode(urlParams.get('mastra') === 'true');
                }
            } catch (error) {
                console.error('Error checking Mastra mode:', error);
                setIsMastraMode(false);
            }
        };

        checkMastraMode();
    }, []);

    // 选择显示传统聊天界面还是Mastra聊天界面
    const renderChatInterface = () => {
        if (isMastraMode) {
            return <MastraChat />;
        } else {
            return (
                <>
                    {isSessionSelected ? (
                        <>
                            <MessageList />
                            <InputBox
                                currentSessionId={currentSessionId}
                                currentSessionType={safeCurrentSession.type || 'chat'}
                            />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-gray-500">
                            <div>
                                <p className="text-xl mb-2">选择或创建一个会话</p>
                                <p>从左侧边栏中选择一个已有会话，或创建一个新的会话开始交流。</p>
                                {onSwitchToNewUI && (
                                    <Button 
                                        onClick={() => {
                                            // 使用更直接的方式切换到新界面
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
                                        }}
                                        className="mt-4"
                                        variant="default"
                                    >
                                        切换到新界面
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            );
        }
    };

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
        );
    }

    return (
        <div
            className={`flex flex-col flex-1 h-full overflow-hidden transition-all duration-300 ${
                sidebarVisible ? 'md:ml-64' : ''
            }`}
        >
            <div className="flex flex-col h-full">
                <Header onSwitchToNewUI={onSwitchToNewUI} />
                {renderChatInterface()}
            </div>
        </div>
    );
};

export default MainPane;
