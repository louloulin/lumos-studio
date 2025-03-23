import React from 'react'
import { useTranslation } from 'react-i18next'
import * as remote from '@/packages/remote'
import { getDefaultStore } from 'jotai'
import platform from '@/packages/platform'
import { settingsAtom } from '@/stores/atoms'
import Markdown from '@/components/Markdown'
import { trackingEvent } from '@/packages/event'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const { useEffect, useState } = React

export default function RemoteDialogWindow() {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [dialogConfig, setDialogConfig] = useState<remote.DialogConfig | null>(null)

    const checkRemoteDialog = async () => {
        const store = getDefaultStore()
        const config = await platform.getConfig()
        const settings = store.get(settingsAtom)
        const version = await platform.getVersion()
        if (version === '0.0.1') {
            return
        }
        try {
            const dialog = await remote.getDialogConfig({
                uuid: config.uuid,
                language: settings.language,
                version: version,
            })
            setDialogConfig(dialog)
            if (dialog) {
                setOpen(true)
            }
        } catch (e) {
            console.log(e)
        }
    }
    useEffect(() => {
        checkRemoteDialog()
        setInterval(checkRemoteDialog, 1000 * 60 * 60 * 24)
    }, [])
    useEffect(() => {
        if (open) {
            trackingEvent('remote_dialog_window', { event_category: 'screen_view' })
        }
    }, [open])

    const onClose = () => {
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={(open) => open || onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogDescription asChild>
                    <div className="space-y-4">
                        <Markdown>{dialogConfig?.markdown || ''}</Markdown>
                        
                        <div className="flex flex-wrap gap-2">
                            {dialogConfig?.buttons.map((button, index) => (
                                <Button 
                                    key={index}
                                    variant="outline" 
                                    onClick={() => platform.openLink(button.url)}
                                >
                                    {button.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </DialogDescription>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose()}>{t('cancel')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
