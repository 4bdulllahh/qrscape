import { makeCreatures } from './creatures'
import { isPaletteId, PALETTE_IDS, PALETTES, type PaletteId } from './palettes'
import { makeQrGrid, type QrGrid } from './qr'
import { SCENES } from './scenes'
import { createRng, seedFor } from './seed'
import { colorize, type ColoredVoxels, type VoxelGrid } from './voxels'

export interface WorldOptions {
  /** 0 is the link's own world; each reroll grows a different one. */
  reroll?: number
  /** Scene id; unknown or missing means the seed picks. */
  scene?: string
  /** Palette id; unknown or missing means the seed picks. */
  palette?: string
}

export interface World {
  sceneId: string
  paletteId: PaletteId
  qr: QrGrid
  grid: VoxelGrid
  voxels: ColoredVoxels
}

export type WorldResult = { ok: true; world: World } | { ok: false; reason: 'empty' | 'too-long' }

/** Link in, world out. Used by the site and by the embed so both always grow the same world. */
export function makeWorld(link: string, options: WorldOptions = {}): WorldResult {
  const qr = makeQrGrid(link)
  if (!qr.ok) return qr
  const rng = createRng(seedFor(link, options.reroll ?? 0))
  // The seed always makes both picks, so overriding one never changes the other.
  const seedScene = rng.pick(SCENES)
  const seedPalette = rng.pick(PALETTE_IDS)
  const scene = SCENES.find((s) => s.id === options.scene) ?? seedScene
  const paletteId = isPaletteId(options.palette) ? options.palette : seedPalette
  const grid = scene.build(qr.grid.size, rng)
  const palette = PALETTES[paletteId]
  const creatureRng = createRng(seedFor(`${link}#creatures`, options.reroll ?? 0))
  const creatures = makeCreatures(grid, palette, creatureRng, scene.creatures ?? ['butterfly', 'bird'])
  return {
    ok: true,
    world: {
      sceneId: scene.id,
      paletteId,
      qr: qr.grid,
      grid,
      voxels: { ...colorize(grid, qr.grid, palette), creatures },
    },
  }
}
