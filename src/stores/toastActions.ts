import { getDefaultStore } from 'jotai'
import * as atoms from './atoms'
import { v4 as uuidv4 } from 'uuid'

export function add(content: string) {
    const store = getDefaultStore()
    const newToast = { id: `toast:${uuidv4()}`, content, shown: false }
    store.set(atoms.toastsAtom, (toasts) => [...toasts, newToast])
}

export function remove(id: string) {
    const store = getDefaultStore()
    store.set(atoms.toastsAtom, (toasts) => toasts.filter((toast) => toast.id !== id))
}

export function markAsShown(id: string) {
    const store = getDefaultStore()
    store.set(atoms.toastsAtom, (toasts) => 
        toasts.map((toast) => 
            toast.id === id ? { ...toast, shown: true } : toast
        )
    )
}
