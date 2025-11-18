import { Button } from '@/components/ui/button'
import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, isThemeEnforced } = useTheme()

  // Don't render if theme is enforced by community
  if (isThemeEnforced) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const getIcon = () => {
    return theme === 'light' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    )
  }

  const getTooltip = () => {
    return theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={getTooltip()}
      className="relative"
    >
      {getIcon()}
    </Button>
  )
}
