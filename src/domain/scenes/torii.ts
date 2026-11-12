import { VoxelGrid } from '../voxels'
import { blob, box, slab } from './shapes'
import type { SceneDef } from './types'

/** A red torii gate standing in calm water, a sandy shore with stone lanterns behind it. */
export const torii: SceneDef = {
  group: 'city',
  id: 'torii',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'water')
    const c = Math.round((size - 1) / 2)
    const along = rng.chance(0.5)
    // Writes in gate space: u runs along the gate, v across it.
    const put = (
      u0: number,
      y0: number,
      v0: number,
      u1: number,
      y1: number,
      v1: number,
      m: Parameters<typeof box>[7],
    ) => (along ? box(grid, u0, y0, v0, u1, y1, v1, m) : box(grid, v0, y0, u0, v1, y1, u1, m))

    // Shore along the far edge: sand, then grass, with two lanterns.
    const shore = Math.round(size * (0.22 + rng.next() * 0.08))
    put(0, 0, 0, size - 1, 0, shore, 'sand')
    put(0, 1, 0, size - 1, 1, shore - 3, 'grass')
    for (const u of [c - Math.round(size * 0.2), c + Math.round(size * 0.2)]) {
      put(u, 2, shore - 5, u, 3, shore - 5, 'stone')
      put(u - 1, 4, shore - 6, u + 1, 5, shore - 4, 'stone')
      put(u - 1, 6, shore - 6, u + 1, 6, shore - 4, 'roof')
    }

    const half = Math.round(size * (0.18 + rng.next() * 0.06))
    const h = Math.round(size * (0.4 + rng.next() * 0.1))
    const t = size >= 33 ? 1 : 0
    const v = c + rng.int(0, 3)
    for (const u of [c - half, c + half]) {
      put(u - 1, 1, v - 1, u + t + 1, 1, v + t + 1, 'stone')
      put(u, 1, v, u + t, h, v + t, 'accent')
    }
    // Lower beam (nuki), upper band (shimaki) and the dark top beam (kasagi) with lifted ends.
    put(c - half - 2, Math.round(h * 0.72), v, c + half + t + 2, Math.round(h * 0.72), v + t, 'accent')
    put(c - half - 2, h + 1, v, c + half + t + 2, h + 1, v + t, 'accent')
    put(c - half - 4, h + 2, v - 1, c + half + t + 4, h + 2, v + t + 1, 'roof')
    put(c - half - 4, h + 3, v - 1, c - half - 3, h + 3, v + t + 1, 'roof')
    put(c + half + t + 3, h + 3, v - 1, c + half + t + 4, h + 3, v + t + 1, 'roof')

    // A few rocks breaking the water.
    for (let i = rng.int(2, 4); i > 0; i--)
      blob(grid, [rng.int(2, size - 3), 0, rng.int(shore + 3, size - 3)], rng.int(1, 2), 'stone', 0.7, 20)
    return grid
  },
}
