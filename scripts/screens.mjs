// Screenshots the site on desktop (light) and phone (dark) and reports page errors and sideways scrolling.
// Usage: with `npx vite preview` running: node scripts/screens.mjs [url] [out-dir]
import { chromium } from 'playwright-core'
const url = process.argv[2] ?? 'http://localhost:4173'
const out = process.argv[3] ?? '.'
const b = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
for (const [name, w, h, scheme] of [
  ['desk-light', 1200, 1100, 'light'],
  ['phone-dark', 390, 1300, 'dark'],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme })
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await p.goto(url)
  await p.getByRole('textbox', { name: 'Your link' }).fill('https://abdullahexe.online')
  await p.getByText('Autumn').click()
  await p.waitForTimeout(1500)
  const sw = await p.evaluate(() => document.documentElement.scrollWidth)
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: true })
  console.log(name, 'scrollWidth', sw, 'errors', errors)
}
await b.close()
