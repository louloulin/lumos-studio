import { useEffect } from 'react'
import * as atoms from '@/stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import * as sessionActions from '@/stores/sessionActions'
import Toolbar from './Toolbar'
import { cn } from '@/lib/utils'
import { getAutoGenerateTitle } from '@/stores/settingActions'

interface Props { }

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
                <Toolbar />
            </div>
        </div>
    )
}
