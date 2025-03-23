import React, { useMemo } from 'react'
import { useSetAtom } from 'jotai'
import { Session } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import * as sessionActions from '@/stores/sessionActions'
import * as atoms from '@/stores/atoms'
import { cn } from '@/lib/utils'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Copy, Edit, MoreHorizontal, MessageSquare, Trash } from "lucide-react"

export interface Props {
    session: Session
    selected: boolean
}

function _SessionItem(props: Props) {
    const { session, selected } = props
    const { t } = useTranslation()
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const [menuOpen, setMenuOpen] = React.useState(false)
    
    const onClick = () => {
        sessionActions.switchCurrentSession(session.id)
    }
    
    return (
        <div 
            className={cn(
                "flex items-center px-2 py-1 rounded-md cursor-pointer group/session-item",
                selected ? "bg-secondary" : "hover:bg-secondary/50"
            )}
            onClick={onClick}
        >
            <div className="flex-shrink-0 mr-2">
                {session.picUrl ? (
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={session.picUrl} alt={session.name} />
                        <AvatarFallback><MessageSquare className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                ) : (
                    <MessageSquare className="h-5 w-5" />
                )}
            </div>
            
            <div className="flex-grow min-w-0">
                <div className="truncate text-sm font-medium">
                    {session.name}
                </div>
            </div>
            
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className={cn(
                            "h-8 w-8 p-0", 
                            menuOpen ? "opacity-100" : "opacity-0 group-hover/session-item:opacity-100"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => {
                            setChatConfigDialogSession(session)
                            setMenuOpen(false)
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>{t('edit')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => {
                            sessionActions.copy(session)
                            setMenuOpen(false)
                        }}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        <span>{t('copy')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => {
                            setMenuOpen(false)
                            sessionActions.remove(session)
                        }}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>{t('delete')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default function SessionItemComponent(props: Props) {
    return useMemo(() => {
        return <_SessionItem {...props} />
    }, [props.session, props.selected])
}
