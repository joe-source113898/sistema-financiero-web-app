'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10 bg-[var(--surface-muted)] rounded-lg animate-pulse" />
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 flex items-center justify-center bg-[var(--surface-muted)] hover:opacity-80 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-[var(--text-main)]" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--text-main)]" />
      )}
    </button>
  )
}
