import { atom, SetStateAction } from 'jotai'
import { Toast, Settings } from '@/shared/types'
import { atomWithStorage } from 'jotai/utils'
import { focusAtom } from 'jotai-optics'
import * as defaults from '@/shared/defaults'
import { StorageKey } from '../storage'

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

// 添加回toastsAtom，用于Toast消息
export const toastsAtom = atom<Toast[]>([])

// 保留sessionsAtom的空实现以解决构建错误
export const sessionsAtom = atom<any[]>([])

// 主题
export const activeThemeAtom = atom<'light' | 'dark'>('light')

export const configVersionAtom = atomWithStorage<number>(StorageKey.ConfigVersion, 0, syncStorage)

// UI相关atoms
export const showMessageTimestampAtom = atom<boolean>(false)
export const showModelNameAtom = atom<boolean>(true)
export const showTokenCountAtom = atom<boolean>(false)
export const showWordCountAtom = atom<boolean>(true)
export const showTokenUsedAtom = atom<boolean>(true)
export const enableMarkdownRenderingAtom = atom<boolean>(true)
export const spellCheckAtom = atom<boolean>(false)
export const allowReportingAndTrackingAtom = focusAtom(settingsAtom, (optic) => optic.prop('allowReportingAndTracking'))
