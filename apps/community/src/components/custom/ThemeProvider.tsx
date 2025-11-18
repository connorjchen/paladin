import { createContext, useContext, useEffect, useState } from 'react'
import { ThemeMode } from '@prisma/client'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isThemeEnforced: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  communityThemeMode?: ThemeMode
}

export function ThemeProvider({
  children,
  communityThemeMode,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // If community enforces a specific theme, use that
    if (communityThemeMode === ThemeMode.LIGHT) {
      return 'light'
    }
    if (communityThemeMode === ThemeMode.DARK) {
      return 'dark'
    }

    // For SYSTEM mode, check localStorage first, then system preference
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    // Use system preference for initial default
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  // Check if theme is enforced by community
  const isThemeEnforced =
    communityThemeMode === ThemeMode.LIGHT ||
    communityThemeMode === ThemeMode.DARK

  // Reinitialize theme when community theme mode changes
  useEffect(() => {
    let newTheme: Theme

    if (communityThemeMode === ThemeMode.LIGHT) {
      newTheme = 'light'
    } else if (communityThemeMode === ThemeMode.DARK) {
      newTheme = 'dark'
    } else {
      // For SYSTEM mode, check localStorage first, then system preference
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') {
        newTheme = saved
      } else {
        newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      }
    }

    setTheme(newTheme)
  }, [communityThemeMode])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    // Only save to localStorage if theme is not enforced
    if (!isThemeEnforced) {
      localStorage.setItem('theme', theme)
    }
  }, [theme, isThemeEnforced])

  // Override setTheme to prevent changes when theme is enforced
  const handleSetTheme = (newTheme: Theme) => {
    if (!isThemeEnforced) {
      setTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: handleSetTheme, isThemeEnforced }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
