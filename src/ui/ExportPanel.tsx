import { useState } from 'react'
import type { World } from '../domain/world'
import { downloadBlob, fileBaseName } from '../services/download'
import { t } from './strings'

interface Props {
  world: World
  link: string
}

const button =
  'rounded-full border border-line bg-surface-muted px-5 py-2 text-sm shadow-elev-1 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50'

/** GIF and PNG downloads for email and chat. Export code loads only when used. */
export function ExportPanel({ world, link }: Props) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const name = fileBaseName(link)

  async function run(make: () => Promise<Blob>, ext: string) {
    setBusy(true)
    try {
      const blob = await make()
      downloadBlob(blob, `${name}.${ext}`)
      setStatus(t('downloaded', { size: (blob.size / 1024 / 1024).toFixed(1) }))
    } catch (error) {
      console.error(`${ext} export failed`, error)
      setStatus(t('exportFailed'))
    } finally {
      setBusy(false)
    }
  }

  const gif = () =>
    run(async () => {
      const { exportGif } = await import('../services/exportGif')
      return exportGif(world.voxels, (share) =>
        setStatus(t('makingGif', { percent: Math.round(share * 100) })),
      )
    }, 'gif')

  const png = () =>
    run(async () => {
      const { exportPng } = await import('../services/exportPng')
      return exportPng(world)
    }, 'png')

  return (
    <section aria-labelledby="share-title" className="flex w-full flex-col gap-3">
      <h2 id="share-title" className="text-lg font-semibold">
        {t('shareTitle')}
      </h2>
      <p className="text-fg-subtle text-sm">{t('shareHelp')}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={button} disabled={busy} onClick={gif}>
          {t('downloadGif')}
        </button>
        <button type="button" className={button} disabled={busy} onClick={png}>
          {t('downloadPng')}
        </button>
      </div>
      <p role="status" className="text-fg-subtle min-h-5 text-sm">
        {status}
      </p>
    </section>
  )
}
