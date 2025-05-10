import { MutableRefObject, useEffect, useState } from 'react'
import SessionItem from './SessionItem'
import * as atoms from '@/stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import type { DragEndEvent } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { cn } from '@/lib/utils'
import { Session } from '@/shared/types'
import { Button } from './ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import * as sessionActions from '@/stores/sessionActions'
import * as defaults from '@/shared/defaults'

export interface Props {
    sessionListRef: MutableRefObject<HTMLDivElement | null>
}

export default function SessionList(props: Props) {
    // 添加错误状态和加载状态
    const [error, setError] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [localSessions, setLocalSessions] = useState<Session[]>([])
    
    // 始终获取Jotai的atom，不放在条件语句中
    const sessions = useAtomValue(atoms.sessionsAtom)
    const sortedSessions = useAtomValue(atoms.sortedSessionsAtom)
    const setSessions = useSetAtom(atoms.sessionsAtom)
    const currentSessionId = useAtomValue(atoms.currentSessionIdAtom)
    
    // 使用一个useEffect来处理数据验证和错误处理
    useEffect(() => {
        try {
            // 验证会话数据的有效性
            if (!Array.isArray(sortedSessions) || sortedSessions.length === 0) {
                throw new Error("Invalid sessions data")
            }
            
            // 如果数据有效，更新本地状态
            if (Array.isArray(sessions) && sessions.length > 0) {
                setLocalSessions(atoms.sortSessions(sessions))
                setError(false)
            }
        } catch (e) {
            console.error("Error accessing sessions data:", e)
            // 使用默认数据
            setLocalSessions(defaults.sessions())
            setError(true)
        } finally {
            setIsLoading(false)
        }
    }, [sessions, sortedSessions])
    
    // 添加重置函数
    const handleReset = () => {
        try {
            // 清理并重置会话数据
            localStorage.removeItem('chat-sessions')
            localStorage.removeItem('_currentSessionIdCachedAtom')
            
            // 设置为默认会话
            setSessions(defaults.sessions())
            setError(false)
            
            // 刷新页面以确保所有状态都被重置
            window.location.reload()
        } catch (e) {
            console.error("Failed to reset sessions:", e)
        }
    }
    
    // 使用本地安全保存的会话数据
    const sessionsToDisplay = localSessions.length > 0 ? localSessions : sortedSessions
    
    const sensors = useSensors(
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 10,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )
    
    const onDragEnd = (event: DragEndEvent) => {
        if (!event.over) {
            return
        }
        
        try {
            const activeId = event.active.id
            const overId = event.over.id
            if (activeId !== overId) {
                const oldIndex = sessionsToDisplay.findIndex(s => s.id === activeId)
                const newIndex = sessionsToDisplay.findIndex(s => s.id === overId)
                if (oldIndex >= 0 && newIndex >= 0) {
                    const newReversed = arrayMove(sessionsToDisplay, oldIndex, newIndex)
                    setSessions(atoms.sortSessions(newReversed))
                }
            }
        } catch (e) {
            console.error("Error during drag operation:", e)
            // 错误处理 - 可以选择显示一个toast或仅记录错误
        }
    }
    
    // 创建新会话的处理函数
    const handleCreateNewSession = () => {
        try {
            const session = sessionActions.initEmptyChatSession()
            setSessions([session, ...sessionsToDisplay])
            sessionActions.switchCurrentSession(session.id)
        } catch (e) {
            console.error("Failed to create new session:", e)
        }
    }
    
    // 如果有错误，显示错误UI而不是正常的会话列表
    if (error) {
        return (
            <div 
                className="w-full overflow-auto flex-grow flex flex-col items-center justify-center p-4"
                ref={props.sessionListRef}
            >
                <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="text-base font-medium mb-2">会话数据访问出错</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        可能是存储数据损坏或访问权限问题导致的。
                    </p>
                    <Button 
                        onClick={handleReset} 
                        variant="default" 
                        size="sm"
                        className="w-full"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        清理并刷新
                    </Button>
                </div>
            </div>
        )
    }
    
    // 加载中状态
    if (isLoading) {
        return (
            <div 
                className="w-full overflow-auto flex-grow flex items-center justify-center"
                ref={props.sessionListRef}
            >
                <div className="animate-pulse">加载会话列表...</div>
            </div>
        )
    }
    
    return (
        <div
            className={cn(
                "w-full overflow-auto flex-grow"
            )}
            ref={props.sessionListRef}
        >
            {/* 快速创建按钮 */}
            <div className="px-2 py-1 mb-2">
                <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                    onClick={handleCreateNewSession}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>新建会话</span>
                </Button>
            </div>
            
            <DndContext
                modifiers={[restrictToVerticalAxis]}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
            >
                <SortableContext 
                    items={sessionsToDisplay.map(session => session.id)} 
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1 p-1">
                        {sessionsToDisplay.map((session) => (
                            <SortableItem key={session.id} id={session.id}>
                                <SessionItem
                                    selected={currentSessionId === session.id}
                                    session={session}
                                />
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    )
}

function SortableItem(props: {
    id: string
    children: React.ReactNode
}) {
    const { id, children } = props
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    )
}
