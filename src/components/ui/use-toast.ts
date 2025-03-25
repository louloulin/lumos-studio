// Adapted from https://ui.shadcn.com/docs/components/toast
import { useEffect, useState } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

export type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToasterToast = ToastProps & {
  dismiss: () => void
}

// State management
let toasts: ToasterToast[] = []

// Event emitter
const listeners: Array<(toasts: ToasterToast[]) => void> = []

function emitChange() {
  listeners.forEach((listener) => {
    listener([...toasts])
  })
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function toast({
  title,
  description,
  variant,
  action,
}: Omit<ToastProps, "id">) {
  const id = generateId()

  const dismiss = () => removeToast(id)

  const newToast: ToasterToast = {
    id,
    title,
    description,
    variant,
    action,
    dismiss,
  }

  toasts = [newToast, ...toasts].slice(0, TOAST_LIMIT)
  emitChange()

  setTimeout(() => {
    removeToast(id)
  }, TOAST_REMOVE_DELAY)

  return id
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emitChange()
}

export function useToast() {
  const [statesToasts, setStatesToasts] = useState<ToasterToast[]>([])

  useEffect(() => {
    const handleChange = (updatedToasts: ToasterToast[]) => {
      setStatesToasts(updatedToasts)
    }

    listeners.push(handleChange)
    return () => {
      const index = listeners.indexOf(handleChange)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    toast,
    toasts: statesToasts,
    dismiss: (id: string) => removeToast(id),
  }
} 