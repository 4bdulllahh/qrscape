// Downloads the GIF and PNG from the site in Edge, then decodes the PNG and a QR frame of the GIF with jsQR.
// Usage: with `npx vite preview` running: node scripts/export-check.mjs [out-dir] [url]
import { chromium } from 'playwright-core'
import jsQR from 'jsqr'
import { readFileSync, statSync } from 'node:fs'

const out = process.argv[2] ?? '.'
const url = process.argv[3] ?? 'http://localhost:4173'
const link = 'https://abdullahexe.online'
const b = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const p = await b.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.goto(url)
await p.getByRole('textbox', { name: 'Your link' }).fill(link)
await p.getByRole('tab', { name: 'Download' }).click()

async function save(button, timeout) {
  const started = Date.now()
  const [dl] = await Promise.all([
    p.waitForEvent('download', { timeout }),
    p.getByRole('button', { name: button }).click(),
  ])
  const path = `${out}/${dl.suggestedFilename()}`
  await dl.saveAs(path)
  console.log(
    `${dl.suggestedFilename()}: ${(statSync(path).size / 1024).toFixed(0)} KB in ${Date.now() - started} ms`,
  )
  return path
}

// Decodes frame `index` of an image file in the browser (ImageDecoder handles GIF frames).
async function decode(path, type, index) {
  const bytes = Array.from(readFileSync(path))
  const { data, w, h } = await p.evaluate(
    async ({ bytes, type, index }) => {
      const dec = new ImageDecoder({ data: new Uint8Array(bytes), type })
      const { image } = await dec.decode({ frameIndex: index })
      const c = Object.assign(document.createElement('canvas'), {
        width: image.displayWidth,
        height: image.displayHeight,
      })
      const ctx = c.getContext('2d')
      ctx.drawImage(image, 0, 0)
      return { data: Array.from(ctx.getImageData(0, 0, c.width, c.height).data), w: c.width, h: c.height }
    },
    { bytes, type, index },
  )
  return jsQR(Uint8ClampedArray.from(data), w, h)?.data ?? null
}

const png = await save('Download PNG (flat QR code)', 30_000)
console.log('PNG reads:', await decode(png, 'image/png', 0))
const gif = await save('Download GIF', 120_000)
console.log('GIF QR frame reads:', await decode(gif, 'image/gif', 66))
console.log('GIF first frame (scenery) reads:', await decode(gif, 'image/gif', 0))
console.log('errors', errors)
await b.close()
