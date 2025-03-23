import { atom, SetStateAction } from 'jotai'
import { Session, Toast, Settings, Message, SettingWindowTab
} from '@/shared/types'
import { selectAtom, atomWithStorage } from 'jotai/utils'
import { focusAtom } from 'jotai-optics'
import * as defaults from '@/shared/defaults'
import { StorageKey } from '../storage'
import * as LocalForage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

// 使用localStorage作为同步存储
const syncStorage = {
  getItem: (key: string) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  },
  setItem: (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
  },
}

const _settingsAtom = atomWithStorage<Settings>(StorageKey.Settings, defaults.settings(), syncStorage)
export const settingsAtom = atom(
    (get) => {
        const settings = get(_settingsAtom)
        return Object.assign({}, defaults.settings(), settings)
    },
    (get, set, update: SetStateAction<Settings>) => {
        const settings = get(_settingsAtom)
        let newSettings = typeof update === 'function' ? update(settings) : update
        set(_settingsAtom, newSettings)
    }
)

export const languageAtom = focusAtom(settingsAtom, (optic) => optic.prop('language'))
export const themeAtom = focusAtom(settingsAtom, (optic) => optic.prop('theme'))
export const fontSizeAtom = focusAtom(settingsAtom, (optic) => optic.prop('fontSize'))
export const preserveSessionsAtom = focusAtom(settingsAtom, (optic) => optic.prop('preserveSessions'))
export const autoSaveAtom = focusAtom(settingsAtom, (optic) => optic.prop('autoSave'))
export const saveIntervalAtom = focusAtom(settingsAtom, (optic) => optic.prop('saveInterval'))

// sessions
const _sessionsAtom = atomWithStorage<Session[]>(StorageKey.ChatSessions, [], syncStorage)
export const sessionsAtom = atom(
    (get) => {
        try {
            let sessions = get(_sessionsAtom)
            // Ensure sessions is always an array, even if it's null/undefined from storage
            if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
                sessions = defaults.sessions()
            }
            return sessions
        } catch (e) {
            console.error('Failed to get sessions:', e)
            // Return default sessions on error
            return defaults.sessions()
        }
    },
    (get, set, update: SetStateAction<Session[]>) => {
        try {
            // Get current sessions, ensuring it's never null/undefined
            const sessions = get(_sessionsAtom) || []
            
            // Apply the update
            let newSessions: Session[]
            try {
                newSessions = typeof update === 'function' ? update(sessions) : update
            } catch (e) {
                console.error('Error updating sessions:', e)
                newSessions = sessions // Keep the old sessions on update error
            }
            
            // Ensure we never save an empty array, use defaults if empty
            if (!newSessions || !Array.isArray(newSessions) || newSessions.length === 0) {
                newSessions = defaults.sessions()
            }
            
            // Save the updated sessions
            set(_sessionsAtom, newSessions)
        } catch (e) {
            console.error('Failed to update sessions:', e)
            // Set to defaults if all else fails
            set(_sessionsAtom, defaults.sessions())
        }
    }
)
export const sortedSessionsAtom = atom((get) => {
    return sortSessions(get(sessionsAtom))
})

export function sortSessions(sessions: Session[]): Session[] {
    return [...sessions].reverse()
}

const _currentSessionIdCachedAtom = atomWithStorage<string | null>('_currentSessionIdCachedAtom', null, syncStorage)
export const currentSessionIdAtom = atom(
    (get) => {
        const idCached = get(_currentSessionIdCachedAtom)
        const sessions = get(sortedSessionsAtom)
        if (idCached && sessions.some((session) => session.id === idCached)) {
            return idCached
        }
        return sessions[0]?.id || ''
    },
    (_get, set, update: string) => {
        set(_currentSessionIdCachedAtom, update)
    }
)

export const currentSessionAtom = atom((get) => {
    const id = get(currentSessionIdAtom)
    const sessions = get(sessionsAtom)
    let current = sessions.find((session) => session.id === id)
    if (!current && sessions.length > 0) {
        return sessions[sessions.length - 1]    // fallback to the last session
    }
    return current || defaults.sessions()[0]
})

export const currentSessionNameAtom = selectAtom(currentSessionAtom, (s) => s.name)

export const currentMessageListAtom = selectAtom(currentSessionAtom, (s) => {
    let messageContext: Message[] = []
    if (s.messages) {
        messageContext = messageContext.concat(s.messages)
    }
    return messageContext
})

// toasts
export const toastsAtom = atom<Toast[]>([])

// theme
export const activeThemeAtom = atom<'light' | 'dark'>('light')

export const configVersionAtom = atomWithStorage<number>(StorageKey.ConfigVersion, 0, syncStorage)

export const messageListRefAtom = atom<null | React.MutableRefObject<HTMLDivElement | null>>(null)

export const openSettingDialogAtom = atom<SettingWindowTab | null>(null)
export const sessionCleanDialogAtom = atom<Session | null>(null)
export const chatConfigDialogAtom = atom<Session | null>(null)

// UI相关atoms
export const showMessageTimestampAtom = atom<boolean>(false)
export const showModelNameAtom = atom<boolean>(true)
export const showTokenCountAtom = atom<boolean>(false)
export const showWordCountAtom = atom<boolean>(true)
export const showTokenUsedAtom = atom<boolean>(true)
export const enableMarkdownRenderingAtom = atom<boolean>(true)
export const autoGenerateTitleAtom = atom<boolean>(true)
export const currsentSessionPicUrlAtom = atom<string | undefined>(undefined)
export const spellCheckAtom = atom<boolean>(false)
export const myCopilotsAtom = atom<any[]>([])
export const allowReportingAndTrackingAtom = selectAtom(settingsAtom, (s) => s.allowReportingAndTracking)
