import { useDeferredValue, useMemo, useState } from 'react'
import { DAY } from '../domain/palettes'
import { makeQrGrid } from '../domain/qr'
import { buildScene } from '../domain/scenes'
import { colorize } from '../domain/voxels'
import { SceneView } from './SceneView'
import { t } from './strings'
import { ThemeToggle } from './ThemeToggle'

const EXAMPLE_LINK = 'https://example.com'

export function App() {
  const [link, setLink] = useState('')
  const [showQr, setShowQr] = useState(false)
  const typed = useDeferredValue(link)

  // Empty box shows an example world so the page is never blank; the box itself starts empty.
  const result = useMemo(() => {
    const value = typed.trim() || EXAMPLE_LINK
    const qr = makeQrGrid(value)
    if (!qr.ok) return { error: qr.reason }
    return { voxels: colorize(buildScene(value, qr.grid.size).grid, qr.grid, DAY) }
  }, [typed])

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('appName')}</h1>
        <ThemeToggle />
      </header>
      <main className="rounded-panel border-line bg-surface shadow-elev-1 flex flex-col items-center gap-6 border p-4 sm:p-6">
        <p className="text-fg-subtle text-center">{t('tagline')}</p>
        <label className="flex w-full max-w-xl flex-col gap-2">
          <span className="text-sm font-medium">{t('linkLabel')}</span>
          <input
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={EXAMPLE_LINK}
            className="border-line bg-canvas text-fg placeholder:text-fg-subtle focus-visible:outline-accent w-full rounded-full border px-5 py-3 focus-visible:outline-2"
          />
        </label>
        {'error' in result ? (
          <p role="alert" className="text-fg text-sm">
            {t(result.error === 'too-long' ? 'errorTooLong' : 'errorEmpty')}
          </p>
        ) : (
          <SceneView voxels={result.voxels} showQr={showQr} />
        )}
        <button
          type="button"
          aria-pressed={showQr}
          onClick={() => setShowQr((v) => !v)}
          className="border-line bg-surface-muted shadow-elev-1 hover:bg-canvas focus-visible:outline-accent rounded-full border px-5 py-2 text-sm focus-visible:outline-2"
        >
          {t(showQr ? 'showScenery' : 'showQr')}
        </button>
        <p className="text-fg-subtle text-xs">{t('hoverHint')}</p>
      </main>
    </div>
  )
}
