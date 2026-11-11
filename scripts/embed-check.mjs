// Copies the embed code from the site, pastes it into a page on another origin (python http.server on 8765
// serving <out>/embedsite) and checks the loop: QR first, then scenery, hover shows QR.
// Usage: npx vite preview; (cd <out>/embedsite && python -m http.server 8765); node scripts/embed-check.mjs <out> [site-url]
import { chromium } from 'playwright-core'
import jsQR from 'jsqr'
import { writeFileSync } from 'node:fs'
const out = process.argv[2]
const b = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const site = await b.newPage()
await site.goto(process.argv[3] ?? 'http://localhost:4173')
await site.getByRole('textbox', { name: 'Your link' }).fill('https://abdullahexe.online')
await site.getByText('Large (400 px)').click()
const code = await site.locator('pre code').innerText()
console.log(code)
writeFileSync(
  `${out}/embedsite/index.html`,
  `<!doctype html><body style="background:#fff;font-family:sans-serif"><h1>Someone's website</h1><div style="height:1400px">Scroll down</div>${code}<p>after</p></body>`,
)
const p = await b.newPage({ viewport: { width: 800, height: 700 } })
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await p.goto('http://localhost:8765/index.html')
await p.waitForTimeout(1500)
const before = await p.evaluate(
  () => document.querySelector('qr-scape').shadowRoot.querySelector('canvas').width,
)
await p.locator('qr-scape').scrollIntoViewIfNeeded()
const read = async (name) => {
  await p.locator('qr-scape').screenshot({ path: `${out}/${name}.png` })
  const data = await p.evaluate(() => {
    const src = document.querySelector('qr-scape').shadowRoot.querySelector('canvas')
    const c = Object.assign(document.createElement('canvas'), { width: 400, height: 400 })
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 400, 400)
    ctx.drawImage(src, 0, 0, 400, 400)
    return Array.from(ctx.getImageData(0, 0, 400, 400).data)
  })
  return jsQR(Uint8ClampedArray.from(data), 400, 400)?.data ?? null
}
await p.waitForTimeout(1600)
console.log('in view +1.6s (expect QR):', await read('embed-qr'))
await p.waitForTimeout(3000)
console.log('in view +4.6s (expect scenery):', await read('embed-scenery'))
await p.locator('qr-scape').hover()
await p.waitForTimeout(1500)
console.log('hover (expect QR):', await read('embed-hover'))
console.log('canvas width before scroll', before, 'errors', errors)
await b.close()
