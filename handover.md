# QRscape: handover

For the next Claude session. The user starts it with **"continue read the handover"**: read this file, check
`git status` and `git log --oneline -5`, say in 2 or 3 lines where things stand, then ask what to build next
(the first plan is finished). New work follows the global workflow: playback, questions, milestone plan.

## What it is

A website that turns a link into a QR code drawn as a calm voxel world (15 zen scenes). From a corner it is a
little 3D world; from straight above it scans as a QR code. Every link grows its own world from a seed. Shared as
GIF/PNG (email) or a copy-paste embed for websites. No backend, no accounts, nothing stored.

| What      | Where                                                                     |
| --------- | ------------------------------------------------------------------------- |
| Folder    | `C:\Users\Computer\Documents\GitHub\qrscape`, branch `main`               |
| Remote    | https://github.com/4bdulllahh/qrscape                                     |
| Live site | https://qrscape-ten.vercel.app (Vercel, deploys itself on push to `main`) |
| Embed     | https://qrscape-ten.vercel.app/qrscape.js (same deploy)                   |
| CI        | `.github/workflows/ci.yml`, runs `npm run check` on push                  |
| Version   | 0.1.0 (tag `v0.1.0`), in `package.json` only                              |

## Starting a session

```
npm install
npm run check                    # lint, format check, typecheck, tests, build
npm run dev                      # http://localhost:5173
```

Browser checks (need Edge; not in CI). Build and preview first, then run them in a second terminal:

```
npm run build; npx vite preview  # http://localhost:4173
```

| Command                                                 | What it checks                                                                                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run scan` (or `node scripts/scan-check.mjs <url>`) | Every scene in the Scene list turns into its QR view and decodes (jsQR)                                                                         |
| `node scripts/screens.mjs <url> <out>`                  | Desktop light + phone dark screenshots, axe, sideways scroll, page errors                                                                       |
| `node scripts/scene-sheet.mjs <out> [link] [url]`       | One contact sheet image of all scenes, to eyeball them cheaply                                                                                  |
| `node scripts/export-check.mjs <out> [url]`             | Downloads PNG and GIF, decodes the PNG and GIF frame 66                                                                                         |
| `node scripts/embed-check.mjs <out> [url]`              | Pastes the copied embed code into a page on another origin (python http.server on 8765 serving `<out>/embedsite`) and checks the loop and hover |
| `node scripts/make-assets.mjs [url]`                    | Redraws the logo SVG and renders the icons and `og-image.png`                                                                                   |

Use the scratchpad folder for `<out>`, except `docs/screenshots` when refreshing README images. Pass the live URL to
check production. Stop the preview and http.server afterwards (`netstat -ano | grep :4173`, then `taskkill`).

## How it works

```
link ──► makeQrGrid (EC level H, UTF-8, 2-module quiet zone) ──► QrGrid (boolean per cell)
   └──► seedFor(link, reroll) ──► createRng ──► pick scene, pick mood, then scene.build(size, rng)
                                                        │
VoxelGrid (x,z = QR cell, y = up) ◄─────────────────────┘
   └──► colorize(grid, qr, palette): top voxel of each column = dark/light shade of its material by QR cell;
        lower voxels = the natural "side" colour. Hidden voxels dropped. ──► ColoredVoxels
             └──► ScapeRenderer (three.js InstancedMesh, baked face shading, no lights, orthographic camera)
                  morph 0 = scenery orbit from a corner, 1 = straight down (QR), snapped to the nearest quarter turn
```

- `src/domain/world.ts` `makeWorld(link, { reroll, scene, palette })` is the single entry point for the site, the
  embed and the exports. The seed always picks scene then palette, then builds, so overriding one never shifts the other.
- Straight down with an orthographic camera only the top face of each column is visible, so the view is exactly the
  QR in palette colours. Side faces never show. That is the whole trick.

## How the code is organised

| Path                        | What's in it                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/qr.ts`          | Link to QR grid, input checks (empty, too long)                                                                                         |
| `src/domain/seed.ts`        | FNV-1a hash + mulberry32 random source                                                                                                  |
| `src/domain/voxels.ts`      | `MATERIALS`, `VoxelGrid`, `colorize`, `projectTopDown`, `scanProblems`, `MIN_CONTRAST` = 3, idle `MOTION` per material                  |
| `src/domain/palettes.ts`    | The 5 moods. 7 hand-tuned materials + 9 derived from one "side" colour via `derive()`                                                   |
| `src/domain/scenes/`        | One file per scene, `shapes.ts` helpers (slab, box, cylinder, blob, line, growTree, scatter), `index.ts` = `SCENES` order               |
| `src/domain/world.ts`       | `makeWorld`                                                                                                                             |
| `src/domain/embedCode.ts`   | Builds the copy-paste snippet (escaped), parses `size`/`reroll` attributes                                                              |
| `src/domain/gifTimeline.ts` | GIF frames: orbit swings -0.3 to +0.3 rad so both QR ends snap to the same quarter turn (seamless loop)                                 |
| `src/scene/renderer.ts`     | `ScapeRenderer`: draw, orbit, morph, sway shader, `renderFrame` for export                                                              |
| `src/embed/qrscape.ts`      | `<qr-scape>` custom element (shadow DOM, no React). Loop: QR 2.5 s on entering view, scenery 5 s, repeat; hover = QR; pauses off screen |
| `src/services/`             | `exportPng`, `exportGif` + `gif.worker.ts` (gifenc), `download` helpers                                                                 |
| `src/ui/`                   | React site: `App`, `SceneView` (lazy), `ExportPanel`, `EmbedPanel`, `ThemeToggle`, `strings.ts` (`t()`, `nameOf()`)                     |
| `vite.embed.config.ts`      | Builds `src/embed/qrscape.ts` into `dist/qrscape.js` (one IIFE file with three.js)                                                      |
| `public/`                   | `theme.js` (pre-paint theme, outside the bundle for the CSP), favicon, icons, `og-image.png`                                            |
| `vercel.json`               | CSP (no inline scripts, no `unsafe-eval`), nosniff, referrer, permissions headers                                                       |

## Recipes

**Add a scene**

1. Copy a similar file in `src/domain/scenes/`, export a `SceneDef` with a new `id`. Start with `slab(...)` so no
   column is ever empty. Use only `rng` for randomness (never `Math.random`), and scale sizes with `size`.
2. Add it to the end of `SCENES` in `scenes/index.ts`, and add `scene_<id>` to `src/ui/strings.ts`.
3. `npm run check` (tests check it scans in every mood and names it), then `scene-sheet.mjs` to look at it, then `npm run scan`.

**Add a material:** add it to `MATERIALS` in `voxels.ts`, add a side colour to every mood's `sides` in
`palettes.ts`, optionally a `MOTION` entry. The palette tests fail if contrast drops below 3.

**Add a mood:** add an entry to `PALETTES` (hand shades + sides + tints) and `palette_<id>` to `strings.ts`.

**Release:** follow the global release steps. Version lives only in `package.json`. Notes in `docs/releases/`,
update `README.md`, `CHANGELOG.md`, `docs/roadmap.md`, tag `v<version>`. README screenshots: `screens.mjs` and
`scene-sheet.mjs` against the **live** site into `docs/screenshots` (rename `desk-light-hero.png` to `hero.png`,
delete the extras), so the embed code shows the real address. The gh CLI is not installed: the user makes GitHub releases by hand.

## Rules that must not break

- **Every scene must scan.** Never add a voxel above the top layer in a way that leaves a column empty, and never
  colour a top voxel outside `colorize`. Why: the top view is the QR.
- **Embeds already on websites must not change.** The snippet always writes `scene` and `palette`; keep old scene
  ids and palette ids working forever, and don't change how an existing scene uses `rng` (it would reshape every
  world of that scene, including pasted embeds). New scenes go at the end of `SCENES`. Note: adding a scene still
  changes which scene a link gets when nothing is chosen (the site's "Surprise me"); that's accepted.
- **`qrscape.js` must keep its name and attributes** (`link`, `scene`, `palette`, `reroll`, `size`): people load it
  from their own sites.
- **`src/domain/` never imports three.js, React or the DOM.** The embed must not import React or site CSS.
- **No inline scripts** (CSP). Put boot code in `public/` as a file.
- **Reduce-motion:** the live page stops orbit, sway and auto loop; exports (offscreen canvas) ignore it on purpose.
- **Every UI string through `t()`**, no em/en dashes or the ellipsis character (a test checks `strings.ts`).

## Decisions

- Stack: Vite 8 + React 19 + TS strict + plain three.js (no r3f, so the embed stays React-free) + Tailwind 4, vitest, oxlint, prettier. Vercel.
- QR at error correction H; quiet zone 2 modules (scans fine, keeps the world tight).
- Seed: same link, same world; "Grow another one" = reroll salt; scene and mood pickers override.
- GIF: 480 px, 12 fps, ~8 s, one shared 128-colour palette, ~0.8 MB. PNG: flat top view ~1024 px.
- Embed loop 5 s scenery / 2.5 s QR, starts on scroll into view (threshold 0.4), hover shows QR.
- Look: typencut's sand/navy tokens with an amber accent, `.dark` class, 2 columns on wide screens.
- English only for now (strings ready for `t()`), MIT license.
- Logo drawn in code (`scripts/make-assets.mjs`) because web-asset-generator was not loaded; no `.ico`, browsers use the SVG.

## History

v0.1.0 (2026-11-11) shipped milestones M1 to M15: setup, QR + seed core, voxel engine and morph, tree, site UI
with reroll/scene/mood, embed, GIF/PNG export, 14 more scenes (M8 to M12), logo and icons, two-column layout and
axe pass, release. Verified on the live site: all 15 scenes scan in a browser, exports decode, embed works from
another origin, axe clean. The user confirmed it works, including on their phone.

## Current state

Plan v0.2.0 (approved 2026-11-12, 22 milestones). Done: M1 to M19 (27 scenes).

| #   | Milestone                                                                                              | Size |
| --- | ------------------------------------------------------------------------------------------------------ | ---- |
| 1   | Light theme by default, scene picker with search and Nature / City groups (fixes the arrow)            | M    |
| 2   | Laptops and PCs fit one screen: tabs on the right (Make it, Download, Website code); phones scroll     | M    |
| 3   | Embed size presets plus a custom px box (80 to 1200), code box scrolls inside                          | S    |
| 4   | Details grow with QR size (longer link = more details), applied to every scene                         | M    |
| 5   | Creatures part 1: animated voxel creatures on the site, fade out on hover / QR, still on reduce-motion | M    |
| 6   | Creatures part 2: creatures in the GIF and embed, hidden in QR frames                                  | S    |
| 7   | Tree bushier and bigger (look at tree.icqr in Edge first; WebFetch gets nothing, it is all JS)         | M    |
| 8   | Bonsai: pine, maple, juniper, azalea, shallow pot, moss                                                | M    |
| 9   | Cherry blossom chunkier, fish bowl water nicer, creatures for both                                     | M    |
| 10  | Zen garden better, koi pond natural shape + nicer bridge                                               | M    |
| 11  | Bamboo denser on big QR + panda, more detail for torii and mountains                                   | M    |
| 12  | Tea house with outdoor furniture, coffee shop more than a block                                        | M    |
| 13  | Tofu shop and ramen stall details                                                                      | M    |
| 14  | Lighthouse fixed on big QR, cactus kinds on big QR (bonsai cactus etc.)                                | M    |
| 15  | New tree scenes: pine, baobab, palm                                                                    | M    |
| 16  | New tree scenes: willow, fern                                                                          | S    |
| 17  | Waterfall, onsen, rice terraces                                                                        | M    |
| 18  | Mount Fuji, lily pond                                                                                  | M    |
| 19  | Kyoto pagoda, lantern street                                                                           | M    |
| 20  | Chongqing hillside                                                                                     | M    |
| 21  | Venice canal, Santorini                                                                                | M    |
| 22  | Release v0.2.0                                                                                         | M    |

Decisions for this plan: reworked scenes may change already pasted embeds (user accepted, v0.1.0 was one day old).
Each scene milestone adds its own creatures. New scenes get `group: 'nature' | 'city'` in their `SceneDef`.
The scene picker is a custom listbox (`src/ui/ScenePicker.tsx`); scripts drive it through `scripts/picker.mjs`.

- **Next:** M20 (creature kind `steam` rises off water; `conifer` is exported from pine.ts) (new scenes go at the END of SCENES, with group, creatures and a `scene_<id>` string). `parasol(grid, x, y, z, h, r, material)` in shapes.ts. `lantern(grid, x, y, z)` in shapes.ts draws a stone lantern (used by zen garden and koi pond). Creature kinds now: butterfly, bird, dragonfly, petal (falls from `petal` tops), fish (circles on `water` tops). `scripts/_rolls.mjs` (local, git-excluded) tiles rerolls of one scene; recreate it from M8 if missing. tree.icqr reference: a tall airy tree about 1.3x the ground width, many leaf clusters on thin branches, grass border. `growTree` has a `reach` option for wide crowns. Creatures: `src/domain/creatures.ts` places them (own rng), `SceneDef.creatures` picks kinds, they travel in `ColoredVoxels.creatures`, `renderer.ts` draws them (PARTS, FLIGHT) and fades them early in the morph, so site, GIF and embed all show them. The GIF clock jumps back during the QR hold so the loop is seamless.
- **Known issues:** more than about 16 embeds on one page fail (browser limit on WebGL canvases). No `.ico` favicon.
