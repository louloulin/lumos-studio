"use client"

import * as React from "react"
import { Theme } from "@/shared/types"
import useAppTheme from "@/hooks/useAppTheme"

// 图标: 月亮 (暗色模式)
const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

// 图标: 太阳 (亮色模式)
const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

// 图标: 显示器 (跟随系统)
const SystemIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

/**
 * 主题切换按钮组件
 * 支持在亮色模式、暗色模式、跟随系统之间切换
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme()

  return (
    <div className="theme-toggle">
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        aria-label="切换主题"
      >
        {theme === Theme.DarkMode && (
          <MoonIcon className="h-5 w-5" />
        )}
        {theme === Theme.LightMode && (
          <SunIcon className="h-5 w-5" />
        )}
        {theme === Theme.FollowSystem && (
          <SystemIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}

/**
 * 主题切换菜单组件
 * 提供更详细的主题选择选项
 */
export function ThemeToggleMenu() {
  const { theme, setTheme } = useAppTheme()

  return (
    <div className="theme-menu">
      <button 
        className={`theme-option ${theme === Theme.LightMode ? 'active' : ''}`}
        onClick={() => setTheme(Theme.LightMode)}
      >
        <SunIcon className="h-4 w-4 mr-2" />
        亮色模式
      </button>
      
      <button 
        className={`theme-option ${theme === Theme.DarkMode ? 'active' : ''}`}
        onClick={() => setTheme(Theme.DarkMode)}
      >
        <MoonIcon className="h-4 w-4 mr-2" />
        暗色模式
      </button>
      
      <button 
        className={`theme-option ${theme === Theme.FollowSystem ? 'active' : ''}`}
        onClick={() => setTheme(Theme.FollowSystem)}
      >
        <SystemIcon className="h-4 w-4 mr-2" />
        跟随系统
      </button>
    </div>
  )
} 