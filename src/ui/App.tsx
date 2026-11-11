import { t } from './strings'
import { ThemeToggle } from './ThemeToggle'

export function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('appName')}</h1>
        <ThemeToggle />
      </header>
      <main className="rounded-panel border-line bg-surface shadow-elev-1 border p-6">
        <p className="text-fg-subtle">{t('tagline')}</p>
      </main>
    </div>
  )
}
