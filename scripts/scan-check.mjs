// Opens the site in Edge, turns each world into its QR view and decodes the canvas with jsQR.
// Usage: npm run build && npx vite preview, then: node scripts/scan-check.mjs [url] [screenshot-dir]
import { chromium } from 'playwright-core'
import jsQR from 'jsqr'

const url = process.argv[2] ?? 'http://localhost:4173'
const shots = process.argv[3]
const links = [
  'https://example.com',
  'https://abdullahexe.online',
  'https://github.com/4bdulllahh/qrscape?ref=a1b2',
]
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const browser = await chromium.launch({ executablePath: edge })
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
await page.goto(url)
let failed = 0
for (const [i, link] of links.entries()) {
  await page.getByRole('textbox', { name: 'Your link' }).fill(link)
  const canvas = page.locator('canvas')
  await page.waitForTimeout(1300)
  if (shots) await canvas.screenshot({ path: `${shots}/scenery-${i}.png` })
  await page.getByRole('button', { name: 'Show QR code' }).click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(1600)
  if (shots) await canvas.screenshot({ path: `${shots}/qr-${i}.png` })
  const { data, size } = await page.evaluate(() => {
    const src = document.querySelector('canvas')
    const size = 400
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(src, 0, 0, size, size)
    return { data: Array.from(ctx.getImageData(0, 0, size, size).data), size }
  })
  const code = jsQR(Uint8ClampedArray.from(data), size, size)
  const ok = code?.data === link
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${link}${ok ? '' : ` (read: ${code?.data ?? 'nothing'})`}`)
  await page.getByRole('button', { name: 'Show scenery' }).click()
}
await browser.close()
process.exit(failed ? 1 : 0)
