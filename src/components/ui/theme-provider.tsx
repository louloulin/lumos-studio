"use client"

import * as React from "react"
import { getDefaultStore, useAtomValue } from 'jotai'
import { themeAtom, activeThemeAtom } from '@/stores/atoms'
import platform from '@/packages/platform'
import { Theme } from '@/shared/types'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: "light" | "dark" | "system"
  storageKey?: string
}

// 主题切换函数 - 同步系统主题和用户选择
export const switchTheme = async (theme: Theme) => {
  const store = getDefaultStore()
  
  // 根据主题设置应用相应的类
  if (theme === Theme.FollowSystem) {
    const isDark = await platform.shouldUseDarkColors()
    document.documentElement.classList.toggle('dark', isDark)
    store.set(activeThemeAtom, isDark ? 'dark' : 'light')
  } else {
    const isDark = theme === Theme.DarkMode
    document.documentElement.classList.toggle('dark', isDark)
    store.set(activeThemeAtom, isDark ? 'dark' : 'light')
  }
}

// 主题提供者组件
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
    () => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem(storageKey) as "light" | "dark" | "system") || defaultTheme
      }
      return defaultTheme
    }
  )

  // 主题初始化和系统主题变化监听
  React.useEffect(() => {
    const store = getDefaultStore()
    const storedTheme = store.get(themeAtom)
    
    // 监听系统主题变化
    const unsubscribe = platform.onSystemThemeChange(() => {
      const currentTheme = store.get(themeAtom)
      switchTheme(currentTheme)
    })

    // 初始应用主题
    switchTheme(storedTheme)

    // 清理监听器
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  // 主题上下文数据
  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (theme: "light" | "dark" | "system") => {
        localStorage.setItem(storageKey, theme)
        setTheme(theme)
        // 同步Jotai状态
        const store = getDefaultStore()
        const themeValue = theme === 'dark' ? Theme.DarkMode : 
                          theme === 'light' ? Theme.LightMode : 
                          Theme.FollowSystem
        store.set(themeAtom, themeValue)
      },
    }),
    [theme, storageKey]
  )

  return (
    <div className="theme-provider" {...props}>{children}</div>
  )
} 