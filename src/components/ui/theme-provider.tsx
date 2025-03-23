"use client"

import * as React from "react"
import { getDefaultStore, useAtomValue } from 'jotai'
import { themeAtom } from '@/stores/atoms'
import platform from '@/packages/platform'
import { Theme } from '@/shared/types'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: "light" | "dark" | "system"
  storageKey?: string
}

export const switchTheme = async (theme: Theme) => {
  const store = getDefaultStore()
  if (theme === Theme.FollowSystem) {
    const isDark = await platform.shouldUseDarkColors()
    document.documentElement.classList.toggle('dark', isDark)
  } else {
    document.documentElement.classList.toggle('dark', theme === Theme.DarkMode)
  }
}

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

  React.useEffect(() => {
    const store = getDefaultStore()
    const storedTheme = store.get(themeAtom)
    
    // 监听系统主题变化
    platform.onSystemThemeChange(() => {
      const currentTheme = store.get(themeAtom)
      switchTheme(currentTheme)
    })

    // 初始应用主题
    switchTheme(storedTheme)
  }, [])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (theme: "light" | "dark" | "system") => {
        localStorage.setItem(storageKey, theme)
        setTheme(theme)
      },
    }),
    [theme, storageKey]
  )

  return (
    <div {...props}>{children}</div>
  )
} 