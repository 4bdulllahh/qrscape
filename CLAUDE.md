# QRscape: notes for Claude

A free website that turns any link into a QR code drawn as a calm 8-bit (voxel) 3D landscape: trees,
bonsai, mountains, fish bowls, coffee shops and more. Seen from a corner it is a little world; seen straight
from above it is a scannable QR code. People share it as a GIF or PNG (email) or paste an embed code into
their own website. Inspired by tree.icqr.com (one tree only). Vite + React + plain three.js, no backend,
no accounts. Portfolio piece, v0.2.0 live at https://qrscape-ten.vercel.app.

**Read [handover.md](handover.md) before changing anything.** It has the code map, recipes (add a scene, material,
mood, release), the browser check scripts and where the work stopped.

## Project choices

| Choice    | This project                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------- |
| Stack     | Vite 8, React 19, TypeScript strict, plain three.js (no r3f), Tailwind 4, vitest, oxlint          |
| Data      | None stored. The link, scene, mood and reroll live only in page state and in the embed attributes |
| Languages | English only, but every UI string goes through `t()`                                              |
| Themes    | Light + dark (`.dark` class on `<html>`, tokens in `src/index.css`, typencut's sand/navy look)    |
| Design    | Zen and calm like typencut. taste-skill for art direction, impeccable for the polish pass         |
| Shipping  | Vercel (static). The embed script is served from the same site                                    |
| Version   | 0.2.0, stored in `package.json`                                                                   |
| Skills    | ponytail, i-have-adhd, model-router, taste-skill, web-asset-generator, impeccable                 |
| Repo      | https://github.com/4bdulllahh/qrscape                                                             |

## How it works

- **Seed:** link -> 32-bit hash -> seeded random (`src/domain/seed.ts`). Same link, same scene. Reroll adds a
  salt. `makeWorld` in `src/domain/world.ts` is the one entry point; the embed code always writes scene + palette.
- **QR:** `src/domain/qr.ts` turns the link into a boolean grid (error correction H, quiet zone included).
- **Voxel trick:** a scene is a set of voxel columns on the QR grid. The top-down (orthographic) view of the
  topmost voxel in each cell must be dark exactly where the QR is dark. `src/domain/voxels.ts` builds and checks
  that; `src/scene/` only draws it.
- **Embed loop:** 5 s scenery, then 2.5 s QR, starts when scrolled into view, hover shows the QR.

## Rules that are easy to break

- **Every scene must still scan.** Start each scene with `slab()` so no column is empty; tests check every scene in
  every mood, and `npm run scan` checks them in a real browser.
- **Never break pasted embeds.** Keep scene/palette ids and the `<qr-scape>` attributes forever, add scenes at the
  end of `SCENES`, and don't change how an existing scene uses `rng`. Scenes use only `rng`, never `Math.random`.
- **Every UI string goes through `t()`** in `src/ui/strings.ts`; scene and mood names are `scene_<id>` / `palette_<id>`.
- **`src/domain/` never imports three.js or React.** It is pure and fully tested. `src/scene/` draws, `src/ui/` is React.
- **The embed is self-contained:** it can't use React, the site CSS or anything outside `src/domain` + `src/scene`.
- **CSP has no `unsafe-eval` and no inline scripts** (`vercel.json`). The theme boot script is `public/theme.js`.
- **Respect reduce-motion:** idle motion and auto loops stop when `prefers-reduced-motion` is set.

## Everyday commands

```
npm install
npm run dev        # http://localhost:5173
npm run check      # lint, format check, typecheck, tests, build (what CI runs)
npm run build      # production build in dist/
npm run scan       # with `npx vite preview` running: decodes every QR view in Edge
node scripts/screens.mjs http://localhost:4173 <out-dir>   # desktop + phone screenshots
node scripts/export-check.mjs <out-dir>                    # PNG + GIF download and decode
node scripts/embed-check.mjs <out-dir>                     # embed on another origin (see file header)
```
