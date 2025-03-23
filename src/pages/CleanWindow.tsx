import { useTranslation } from 'react-i18next'
import * as atoms from '@/stores/atoms'
import { useAtom } from 'jotai'
import * as sessionActions from '@/stores/sessionActions'
import { trackingEvent } from '@/packages/event'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
}

export default function CleanWindow(props: Props) {
    const [sessionClean, setSessionClean] = useAtom(atoms.sessionCleanDialogAtom)
    const { t } = useTranslation()
    const close = () => {
        setSessionClean(null)
    }
    const clean = () => {
        if (!sessionClean) {
            return
        }
        sessionClean.messages.forEach((msg) => {
            msg?.cancel?.()
        })
        sessionActions.clear(sessionClean.id)
        trackingEvent('clear_conversation', { event_category: 'user' })
        close()
    }
    return (
        <Dialog open={!!sessionClean} onOpenChange={(open) => !open && close()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('clean')}</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    {t('delete confirmation', {
                        sessionName: '"' + sessionClean?.name + '"',
                    })}
                </DialogDescription>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={close}>{t('cancel')}</Button>
                    <Button variant="destructive" onClick={clean}>
                        {t('clean it up')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
