// Screenshots every scene (picked from the Scene list) and tiles them into one contact sheet, scene-sheet.png.
// Usage: with `npx vite preview` running: node scripts/scene-sheet.mjs [out-dir] [link] [url]
import { chromium } from 'playwright-core'
import { pickScene, sceneList } from './picker.mjs'

const out = process.argv[2] ?? '.'
const link = process.argv[3] ?? 'https://abdullahexe.online'
const url = process.argv[4] ?? 'http://localhost:4173'
const b = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const p = await b.newPage({ viewport: { width: 900, height: 1200 } })
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
await p.goto(url)
await p.getByRole('textbox', { name: 'Your link' }).fill(link)
const scenes = await sceneList(p)
const shots = []
for (const [id, name] of scenes) {
  await pickScene(p, id)
  await p.waitForTimeout(1200)
  shots.push([name, (await p.locator('canvas').screenshot()).toString('base64')])
}
const cols = 4
const sheet = await b.newPage({
  viewport: { width: cols * 300, height: Math.ceil(shots.length / cols) * 320 },
})
await sheet.setContent(
  `<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},300px);font:14px sans-serif;background:#f7efe1">` +
    shots
      .map(
        ([n, s]) =>
          `<figure style="margin:0"><img width=300 src="data:image/png;base64,${s}"><figcaption>${n}</figcaption></figure>`,
      )
      .join('') +
    '</body>',
)
await sheet.screenshot({ path: `${out}/scene-sheet.png`, fullPage: true })
console.log(`${shots.length} scenes, errors:`, errors)
await b.close()
