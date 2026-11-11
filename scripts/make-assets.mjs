// Draws the QRscape logo (an isometric voxel block with a QR pattern on top and a tiny tree) as SVG,
// then renders the PNG icons and the social share image in Edge.
// Usage: with `npx vite preview` running (for the scene in the share image): node scripts/make-assets.mjs [url]
import { chromium } from 'playwright-core'
import { writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:4173'
const N = 5
const PATTERN = ['11101', '10100', '11101', '00010', '10111']
const C = {
  dark: '#2c5a32',
  light: '#d6e8a8',
  left: '#6f9e4c',
  right: '#5a8a3c',
  soil: '#8a6a45',
  soilDark: '#6e5236',
}
const TREE = {
  trunk: '#6e4a2e',
  trunkDark: '#553820',
  leaf: '#5a9a48',
  leafTop: '#c9e6a0',
  leafDark: '#3f7a35',
}

// Isometric projection: x to the lower right, z to the lower left, y up.
const S = 14
const P = (x, y, z) => [(x - z) * S * 0.866 + 100, (x + z) * S * 0.5 - y * S + 70]
const poly = (pts, fill) =>
  `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}"/>`

function cube(x, y, z, s, top, left, right) {
  return [
    poly([P(x, y + s, z), P(x + s, y + s, z), P(x + s, y + s, z + s), P(x, y + s, z + s)], top),
    poly([P(x, y, z + s), P(x + s, y, z + s), P(x + s, y + s, z + s), P(x, y + s, z + s)], left),
    poly([P(x + s, y, z), P(x + s, y, z + s), P(x + s, y + s, z + s), P(x + s, y + s, z)], right),
  ].join('')
}

const H = 2
let body = ''
// Block sides: a grass band over soil.
body += poly([P(0, 0, N), P(N, 0, N), P(N, H, N), P(0, H, N)], C.soil)
body += poly([P(N, 0, 0), P(N, 0, N), P(N, H, N), P(N, H, 0)], C.soilDark)
body += poly([P(0, H - 0.5, N), P(N, H - 0.5, N), P(N, H, N), P(0, H, N)], C.left)
body += poly([P(N, H - 0.5, 0), P(N, H - 0.5, N), P(N, H, N), P(N, H, 0)], C.right)
// QR pattern on the top face.
for (let z = 0; z < N; z++)
  for (let x = 0; x < N; x++)
    body += poly(
      [P(x, H, z), P(x + 1, H, z), P(x + 1, H, z + 1), P(x, H, z + 1)],
      PATTERN[z][x] === '1' ? C.dark : C.light,
    )
// Tiny tree on the back light cell.
body += cube(3.3, H, 0.3, 0.4, TREE.trunk, TREE.trunk, TREE.trunkDark)
body += cube(3.3, H + 0.4, 0.3, 0.4, TREE.trunk, TREE.trunk, TREE.trunkDark)
body += cube(2.85, H + 0.8, -0.15, 1.3, TREE.leafTop, TREE.leaf, TREE.leafDark)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="33 8 134 134">${body}</svg>\n`
writeFileSync('public/favicon.svg', svg)

const b = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
async function png(file, w, h, html) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.setContent(`<body style="margin:0">${html}</body>`)
  await p.screenshot({ path: file, omitBackground: true })
  await p.close()
}
const icon = (px, bg) =>
  `<div style="width:${px}px;height:${px}px;display:grid;place-items:center;background:${bg}">${svg.replace('<svg', `<svg width="${Math.round(px * 0.86)}" height="${Math.round(px * 0.86)}"`)}</div>`
await png('public/apple-touch-icon.png', 180, 180, icon(180, '#f7efe1'))
await png('public/icon-512.png', 512, 512, icon(512, '#f7efe1'))

// Share image: logo and words on the left, a real scene on the right.
const site = await b.newPage({ viewport: { width: 900, height: 1100 } })
await site.goto(url)
await site.getByRole('textbox', { name: 'Your link' }).fill('https://qrscape-ten.vercel.app')
await site.getByRole('combobox', { name: 'Scene' }).selectOption('cherryblossom')
await site.getByText('Day', { exact: true }).click()
await site.waitForTimeout(1500)
const scene = (await site.locator('canvas').screenshot({ omitBackground: true })).toString('base64')
await png(
  'public/og-image.png',
  1200,
  630,
  `<div style="width:1200px;height:630px;background:#f7efe1;display:flex;align-items:center;font-family:system-ui,sans-serif;color:#2b2722">
    <div style="flex:1;padding:0 0 0 80px">
      ${svg.replace('<svg', '<svg width="120" height="120"')}
      <div style="font-size:84px;font-weight:700;letter-spacing:-2px;margin-top:8px">QRscape</div>
      <div style="font-size:34px;color:#6f665a;margin-top:12px;line-height:1.3">Turn any link into a tiny world<br>that is also a QR code.</div>
    </div>
    <img src="data:image/png;base64,${scene}" style="width:560px;height:560px;margin-right:40px">
  </div>`,
)
await b.close()
console.log('wrote public/favicon.svg, apple-touch-icon.png, icon-512.png, og-image.png')
