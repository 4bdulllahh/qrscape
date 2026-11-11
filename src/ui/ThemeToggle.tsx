import { useState } from 'react'
import { t } from './strings'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('qrscape-theme', next ? 'dark' : 'light')
    } catch {
      // Storage blocked (private mode): the choice just isn't remembered.
    }
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t(dark ? 'themeToLight' : 'themeToDark')}
      className="border-line bg-surface text-fg-subtle shadow-elev-1 hover:text-fg focus-visible:outline-accent rounded-full border px-4 py-2 text-sm focus-visible:outline-2"
    >
      {t(dark ? 'themeLight' : 'themeDark')}
    </button>
  )
}
