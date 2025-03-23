import React, { useEffect } from 'react'
import {
    Session,
    createMessage,
} from '@/shared/types'
import { useTranslation } from 'react-i18next'
import * as sessionActions from '@/stores/sessionActions'
import * as atoms from '@/stores/atoms'
import { useAtom } from 'jotai'
import { trackingEvent } from '@/packages/event'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Props {
}

export default function ChatConfigWindow(props: Props) {
    const { t } = useTranslation()
    const [chatConfigDialogSession, setChatConfigDialogSession] = useAtom(atoms.chatConfigDialogAtom)

    const [editingData, setEditingData] = React.useState<Session | null>(chatConfigDialogSession)
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setEditingData(null)
        } else {
            setEditingData({
                ...chatConfigDialogSession,
            })
        }
    }, [chatConfigDialogSession])

    const [systemPrompt, setSystemPrompt] = React.useState('')
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setSystemPrompt('')
        } else {
            const systemMessage = chatConfigDialogSession.messages.find((m) => m.role === 'system')
            setSystemPrompt(systemMessage?.content || '')
        }
    }, [chatConfigDialogSession])

    useEffect(() => {
        if (chatConfigDialogSession) {
            trackingEvent('chat_config_window', { event_category: 'screen_view' })
        }
    }, [chatConfigDialogSession])

    const onCancel = () => {
        setChatConfigDialogSession(null)
        setEditingData(null)
    }
    const onSave = () => {
        if (!chatConfigDialogSession || !editingData) {
            return
        }
        if (editingData.name === '') {
            editingData.name = chatConfigDialogSession.name
        }
        editingData.name = editingData.name.trim()
        if (systemPrompt === '') {
            editingData.messages = editingData.messages.filter((m) => m.role !== 'system')
        } else {
            const systemMessage = editingData.messages.find((m) => m.role === 'system')
            if (systemMessage) {
                systemMessage.content = systemPrompt.trim()
            } else {
                editingData.messages.unshift(createMessage('system', systemPrompt.trim()))
            }
        }
        sessionActions.modify(editingData)
        setChatConfigDialogSession(null)
    }

    if (!chatConfigDialogSession || !editingData) {
        return null
    }
    return (
        <Dialog open={!!chatConfigDialogSession} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Conversation Settings')}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('name')}</Label>
                        <Input
                            id="name"
                            value={editingData.name}
                            onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="prompt">{t('Instruction (System Prompt)')}</Label>
                        <Textarea
                            id="prompt"
                            placeholder={t('Copilot Prompt Demo') || ''}
                            className="min-h-[80px]"
                            value={systemPrompt}
                            onChange={(event) => setSystemPrompt(event.target.value)}
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>{t('cancel')}</Button>
                    <Button onClick={onSave}>{t('save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
