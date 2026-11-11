# QRscape: handover

For the next Claude session. The user starts it with **"continue read the handover"**: read this file, check
`git status` and `git log --oneline -5`, say in 2 or 3 lines where things stand, then carry on with the next
milestone. The plan below is already approved.

## What it is

A website that turns a link into a QR code drawn as a calm voxel landscape (15 zen scenes). From a corner it is
a little 3D world, from straight above it scans as a QR code. Shared as GIF/PNG or as a copy-paste embed. No
backend, no accounts, nothing stored.

| What      | Where                                                              |
| --------- | ------------------------------------------------------------------ |
| Folder    | `C:\Users\Computer\Documents\GitHub\qrscape`, branch `main`        |
| Remote    | https://github.com/4bdulllahh/qrscape                              |
| Live site | https://qrscape-ten.vercel.app (Vercel, deploys on push to `main`) |
| CI        | `.github/workflows/ci.yml`, runs `npm run check` on push           |

## Starting a session

```
npm install
npm run check
npm run dev
# Real scan test in Edge (not in CI, needs Edge):
npm run build; npx vite preview   # then in a second terminal:
npm run scan
```

## How the code is organised

| Folder        | What's in it                                                                  |
| ------------- | ----------------------------------------------------------------------------- |
| `src/domain/` | Pure logic (seed, QR grid, voxel scenes). No three.js, no React. Fully tested |
| `src/scene/`  | three.js renderer: draws a voxel scene, camera, scenery/QR morph              |
| `src/ui/`     | React site. `strings.ts` holds every on-screen string (`t()`)                 |
| `public/`     | `theme.js` boot script (kept out of the bundle for the CSP)                   |

## Decisions from the planning rounds

- Stack: Vite + React + plain three.js (so the embed can ship without React). Vercel hosting.
- Embed: `<script src=".../qrscape.js">` + `<qr-scape link="..." size="300">` custom element.
- Seed: same link gives the same scene; Reroll + scene picker override it, stored in the embed attributes.
- Embed/site loop: 5 s scenery, 2.5 s QR, starts when scrolled into view, hover morphs to QR.
- PNG = top-down QR in the terrain colours. GIF = ~4 s orbit then morph to QR and back, ~512 px, under 2 MB.
- Gentle idle motion (stops on reduce-motion). 5 mood palettes, no free colour pickers.
- English only via `t()`, MIT, version 0.1.0.
- 15 scenes: tree, bonsai, mountains, fish bowl, zen garden, cherry blossom, koi pond, bamboo grove, torii gate,
  tea house, coffee shop, tofu shop, ramen stall, lighthouse island, cactus pot.
- Skills for this project: taste-skill (M5), web-asset-generator (M13), impeccable (M14). User installs them.

## Milestones

| #   | Milestone                                                         | Size | Status |
| --- | ----------------------------------------------------------------- | ---- | ------ |
| M1  | Setup: docs, skeleton, theme tokens, CI, vercel.json              | M    | done   |
| M2  | Core: link to QR grid, link to seed, tests                        | S    | done   |
| M3  | Voxel engine: columns that project to the QR, ortho camera, morph | M    | done   |
| M4  | Tree scene + idle motion                                          | M    | done   |
| M5  | Site UI: paste, Reroll, scene picker, palettes (taste-skill)      | M    | done   |
| M6  | Embed `<qr-scape>`: loop, in-view start, hover, Copy code panel   | M    | done   |
| M7  | Export: PNG + GIF (web worker)                                    | M    | done   |
| M8  | Scenes: bonsai, mountains, fish bowl                              | M    | done   |
| M9  | Scenes: zen garden, cherry blossom, koi pond                      | M    | done   |
| M10 | Scenes: bamboo grove, torii gate, tea house                       | M    | done   |
| M11 | Scenes: coffee shop, tofu shop, ramen stall                       | M    | done   |
| M12 | Scenes: lighthouse island, cactus pot                             | S    | done   |
| M13 | Logo, favicon, social image (web-asset-generator)                 | S    |        |
| M14 | Polish: impeccable, axe, 390 px, real phone scan of all scenes    | M    |        |
| M15 | Release to Vercel: README, notes, tag                             | S    |        |

## Current state

- **Last done:** M12 scenes lighthouse island (rocky island, striped tower, lamp room, cottage) and cactus pot (tapered pot, 3-wide stem, 2-3 arms, flower, pebbles). All 15 scenes done. `npm run scan` now picks every scene and decoded all 15 in Edge.
- **Next:** M13 logo, favicon and social share image (web-asset-generator skill, user installs it). Then M14 polish, M15 release.
- **Open questions:** none.
- **Known issues:** missing favicon (404) until M13. Browsers allow about 16 WebGL canvases per page, so more than ~16 embeds on one page will fail.
- **Not pushed:** all commits (ask before pushing).
