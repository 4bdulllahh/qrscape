import { lazy, Suspense, useDeferredValue, useMemo, useState } from 'react'
import { PALETTE_IDS } from '../domain/palettes'
import { SCENES } from '../domain/scenes'
import { makeWorld } from '../domain/world'
import { EmbedPanel } from './EmbedPanel'
import { ExportPanel } from './ExportPanel'
import { nameOf, t } from './strings'
import { ThemeToggle } from './ThemeToggle'

// three.js is most of the bundle: load it after the page has painted.
const SceneView = lazy(() => import('./SceneView').then((m) => ({ default: m.SceneView })))

const EXAMPLE_LINK = 'https://example.com'
const button =
  'rounded-full border border-line bg-surface-muted px-5 py-2 text-sm shadow-elev-1 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent'

export function App() {
  const [link, setLink] = useState('')
  const [reroll, setReroll] = useState(0)
  const [scene, setScene] = useState('')
  const [palette, setPalette] = useState('')
  const [showQr, setShowQr] = useState(false)
  const typed = useDeferredValue(link)

  // Empty box shows an example world so the page is never blank; the box itself starts empty.
  const result = useMemo(
    () => makeWorld(typed.trim() || EXAMPLE_LINK, { reroll, scene, palette }),
    [typed, reroll, scene, palette],
  )
  // The seed's own picks, shown next to "Surprise me".
  const auto = useMemo(() => makeWorld(typed.trim() || EXAMPLE_LINK, { reroll }), [typed, reroll])

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <img src="/favicon.svg" alt="" width={32} height={32} />
          {t('appName')}
        </h1>
        <ThemeToggle />
      </header>
      {/* Phones: controls, world, sharing. Wide screens: the world stays in view on the left. */}
      <main className="rounded-panel border-line bg-surface shadow-elev-1 grid gap-6 border p-4 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col gap-5 lg:col-start-2">
          <p className="text-fg-subtle">{t('tagline')}</p>
          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-medium">{t('linkLabel')}</span>
            <input
              type="url"
              inputMode="url"
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
                setReroll(0)
              }}
              placeholder={EXAMPLE_LINK}
              className="border-line bg-canvas text-fg placeholder:text-fg-subtle focus-visible:outline-accent w-full rounded-full border px-5 py-3 focus-visible:outline-2"
            />
          </label>
          <div className="flex w-full flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t('scenePicker')}</span>
              <select
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                className="border-line bg-canvas text-fg focus-visible:outline-accent rounded-full border px-4 py-2 focus-visible:outline-2"
              >
                <option value="">
                  {t('auto', { name: auto.ok ? nameOf('scene', auto.world.sceneId) : '' })}
                </option>
                {SCENES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {nameOf('scene', s.id)}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t('moodPicker')}</legend>
              <div className="flex flex-wrap gap-2">
                {['', ...PALETTE_IDS].map((id) => (
                  <label
                    key={id || 'auto'}
                    className="border-line has-checked:border-accent has-checked:bg-canvas has-focus-visible:outline-accent cursor-pointer rounded-full border px-3 py-1.5 text-sm has-focus-visible:outline-2"
                  >
                    <input
                      type="radio"
                      name="palette"
                      value={id}
                      checked={palette === id}
                      onChange={() => setPalette(id)}
                      className="sr-only"
                    />
                    {id
                      ? nameOf('palette', id)
                      : t('auto', { name: auto.ok ? nameOf('palette', auto.world.paletteId) : '' })}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 self-start lg:sticky lg:top-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {result.ok ? (
            <Suspense
              fallback={
                <div className="text-fg-subtle grid aspect-square w-full max-w-[560px] place-items-center">
                  {t('loadingScene')}
                </div>
              }
            >
              <SceneView voxels={result.world.voxels} showQr={showQr} />
            </Suspense>
          ) : (
            <p role="alert" className="text-fg text-sm">
              {t(result.reason === 'too-long' ? 'errorTooLong' : 'errorEmpty')}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className={button} onClick={() => setReroll((r) => r + 1)}>
              {t('reroll')}
            </button>
            <button
              type="button"
              aria-pressed={showQr}
              className={button}
              onClick={() => setShowQr((v) => !v)}
            >
              {t(showQr ? 'showScenery' : 'showQr')}
            </button>
          </div>
          <p className="text-fg-subtle text-xs">{t('hoverHint')}</p>
        </div>
        <div className="flex flex-col gap-8 lg:col-start-2">
          {result.ok && <ExportPanel world={result.world} link={typed.trim() || EXAMPLE_LINK} />}
          {result.ok && (
            <EmbedPanel
              link={typed.trim() || EXAMPLE_LINK}
              sceneId={result.world.sceneId}
              paletteId={result.world.paletteId}
              reroll={reroll}
            />
          )}
        </div>
      </main>
    </div>
  )
}
