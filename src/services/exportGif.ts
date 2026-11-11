import { GIF_FPS, gifTimeline } from '../domain/gifTimeline'
import type { ColoredVoxels } from '../domain/voxels'
import { ScapeRenderer } from '../scene/renderer'
import type { GifJob } from './gif.worker'

const SIZE = 480
/** Light sand behind the world: reads well in email and keeps a light border around the QR. */
const BACKGROUND = '#f7efe1'

/**
 * Renders the looping GIF (orbit, morph to QR, hold, back) offscreen and encodes it in a worker.
 * Rendering stays on the main thread (WebGL) but yields every frame so the page keeps responding.
 */
export async function exportGif(voxels: ColoredVoxels, onProgress: (share: number) => void): Promise<Blob> {
  const canvas = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE })
  const flat = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE })
  const ctx = flat.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D is not available')
  const renderer = new ScapeRenderer(canvas, 1)
  const worker = new Worker(new URL('./gif.worker.ts', import.meta.url), { type: 'module' })
  const send = (job: GifJob, transfer: Transferable[] = []) => worker.postMessage(job, transfer)

  const done = new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<{ ok: true; bytes: Uint8Array } | { ok: false; message: string }>) =>
      e.data.ok
        ? resolve(new Blob([e.data.bytes as Uint8Array<ArrayBuffer>], { type: 'image/gif' }))
        : reject(new Error(e.data.message))
    worker.onerror = (e) => reject(new Error(e.message))
  })

  const snapshot = (azimuth: number, morph: number, time: number) => {
    renderer.renderFrame(azimuth, morph, time)
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.drawImage(canvas, 0, 0)
    return ctx.getImageData(0, 0, SIZE, SIZE).data
  }

  try {
    renderer.setVoxels(voxels)
    const frames = gifTimeline()
    // Palette sample: one scenery frame and one QR frame side by side.
    const scenery = snapshot(0, 0, 0)
    const qr = snapshot(0, 1, 0)
    const sample = new Uint8ClampedArray(scenery.length * 2)
    sample.set(scenery)
    sample.set(qr, scenery.length)
    send({ type: 'palette', rgba: sample }, [sample.buffer])

    for (const [i, f] of frames.entries()) {
      const rgba = snapshot(f.azimuth, f.morph, f.time)
      send({ type: 'frame', rgba, width: SIZE, height: SIZE, delay: 1000 / GIF_FPS }, [rgba.buffer])
      onProgress((i + 1) / frames.length)
      await new Promise((r) => setTimeout(r, 0))
    }
    send({ type: 'finish' })
    return await done
  } finally {
    renderer.dispose()
    worker.terminate()
  }
}
