import {} from 'react'
import * as toastActions from '@/stores/toastActions'
import * as atoms from '@/stores/atoms'
import { useAtomValue } from 'jotai'
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from 'react'

function Toasts() {
    const toasts = useAtomValue(atoms.toastsAtom)
    const { toast } = useToast()

    useEffect(() => {
        toasts.forEach((t) => {
            if (!t.shown) {
                toast({
                    title: t.content,
                    duration: 3000,
                })
                toastActions.markAsShown(t.id)
            }
        })
    }, [toasts, toast])

    return <Toaster />
}

export default Toasts
