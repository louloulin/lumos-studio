import { useLayoutEffect, useMemo } from 'react'
import { getDefaultStore, useAtomValue, useSetAtom } from 'jotai'
import { activeThemeAtom, themeAtom, fontSizeAtom } from '@/stores/atoms'
import { Theme } from '@/shared/types'
import platform from '@/packages/platform'

/**
 * 切换主题函数
 * 根据用户选择或系统设置应用相应的主题
 */
export const switchTheme = async (theme: Theme) => {
    const store = getDefaultStore()
    if (theme === Theme.FollowSystem) {
        const isDark = await platform.shouldUseDarkColors()
        store.set(activeThemeAtom, isDark ? 'dark' : 'light')
    } else {
        store.set(activeThemeAtom, theme === Theme.DarkMode ? 'dark' : 'light')
    }
}

/**
 * 应用主题钩子
 * 提供主题状态和操作方法
 */
export default function useAppTheme() {
    const theme = useAtomValue(themeAtom)
    const setTheme = useSetAtom(themeAtom)
    const fontSize = useAtomValue(fontSizeAtom)
    const activeTheme = useAtomValue(activeThemeAtom)

    // 初始化主题
    useLayoutEffect(() => {
        switchTheme(theme)
    }, [theme])

    // 监听系统主题变化
    useLayoutEffect(() => {
        const unsubscribe = platform.onSystemThemeChange(() => {
            const store = getDefaultStore()
            const theme = store.get(themeAtom)
            switchTheme(theme)
        })

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe()
            }
        }
    }, [])

    // 应用主题到DOM
    useLayoutEffect(() => {
        // 更新HTML属性
        document.querySelector('html')?.setAttribute('data-theme', activeTheme)
        
        // 更新暗黑模式类
        if (activeTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        // 更新字体大小
        document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`)
    }, [activeTheme, fontSize])

    // 提供主题切换功能
    const toggleTheme = () => {
        if (theme === Theme.DarkMode) {
            setTheme(Theme.LightMode)
        } else if (theme === Theme.LightMode) {
            setTheme(Theme.FollowSystem)
        } else {
            setTheme(Theme.DarkMode)
        }
    }

    // 直接设置指定主题
    const setSpecificTheme = (newTheme: Theme) => {
        setTheme(newTheme)
    }

    // 提供主题相关功能和状态
    return useMemo(() => ({
        mode: activeTheme,
        theme,
        fontSize,
        isDark: activeTheme === 'dark',
        toggleTheme,
        setTheme: setSpecificTheme,
    }), [activeTheme, theme, fontSize])
}
