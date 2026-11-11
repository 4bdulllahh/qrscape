import { applyPalette, GIFEncoder, quantize, type GifPalette } from 'gifenc'

/** Messages: one 'palette' sample, then 'frame's, then 'finish'. Replies with the GIF bytes or an error. */
export type GifJob =
  | { type: 'palette'; rgba: Uint8ClampedArray }
  | { type: 'frame'; rgba: Uint8ClampedArray; width: number; height: number; delay: number }
  | { type: 'finish' }

const gif = GIFEncoder()
let palette: GifPalette = []

self.onmessage = (event: MessageEvent<GifJob>) => {
  try {
    const job = event.data
    // One shared palette for every frame: no colour flicker, and smaller files.
    if (job.type === 'palette') palette = quantize(job.rgba, 128)
    else if (job.type === 'frame')
      gif.writeFrame(applyPalette(job.rgba, palette), job.width, job.height, { palette, delay: job.delay })
    else {
      gif.finish()
      const bytes = gif.bytes()
      self.postMessage({ ok: true, bytes }, { transfer: [bytes.buffer] })
    }
  } catch (error) {
    self.postMessage({ ok: false, message: String(error) })
  }
}
