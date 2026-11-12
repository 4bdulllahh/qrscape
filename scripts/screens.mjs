// Screenshots the site on desktop (light) and phone (dark) and reports page errors, sideways scrolling and axe
// accessibility violations.
// Usage: with `npx vite preview` running: node scripts/screens.mjs [url] [out-dir]
import { chromium } from 'playwright-core'
const url = process.argv[2] ?? 'http://localhost:4173'
const out = process.argv[3] ?? '.'
const b = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
for (const [name, w, h, scheme] of [
  ['desk-light', 1280, 800, 'light'],
  ['phone-dark', 390, 1300, 'dark'],
]) {
  // bypassCSP: the live site's CSP (rightly) blocks the injected axe script.
  const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, bypassCSP: true })
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await p.goto(url)
  await p.getByRole('textbox', { name: 'Your link' }).fill('https://abdullahexe.online')
  await p.getByText('Autumn').click()
  await p.waitForTimeout(1500)
  const sw = await p.evaluate(() => document.documentElement.scrollWidth)
  await p.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' })
  const axe = await p.evaluate(async () =>
    (await window.axe.run()).violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`),
  )
  console.log(name, 'axe', axe)
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: true })
  // README hero: one laptop screen (the page fits without scrolling; the embed code is in its own tab).
  await p.screenshot({
    path: `${out}/${name}-hero.png`,
    clip: { x: 0, y: 0, width: w, height: h },
  })
  console.log(name, 'scrollWidth', sw, 'errors', errors)
}
await b.close()
