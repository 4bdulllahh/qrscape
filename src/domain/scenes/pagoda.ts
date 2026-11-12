import { VoxelGrid } from '../voxels'
import { box, decorate, detail, growTree, lantern, slab } from './shapes'
import type { SceneDef } from './types'

/**
 * A five-storey Kyoto pagoda in a temple courtyard: wide eaves with lifted corners, a ringed spire,
 * a stone path, lanterns, red maples and a white wall with a tiled cap.
 */
export const pagoda: SceneDef = {
  group: 'city',
  id: 'pagoda',
  creatures: ['bird', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, Math.round(size * 1.1))
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'sand')
    const c = Math.round((size - 1) / 2) + rng.int(-1, 1)
    const half = Math.max(3, Math.round(size * 0.12))
    const storey = Math.max(3, Math.round(size * 0.1))

    // Stone base, then five storeys that step in, each with wide eaves.
    box(grid, c - half - 2, 2, c - half - 2, c + half + 2, 3, c + half + 2, 'stone')
    let y = 4
    for (let s = 0; s < 5; s++) {
      const w = half - Math.floor((s * half) / 6)
      box(grid, c - w, y, c - w, c + w, y + storey - 2, c + w, s % 2 ? 'accent' : 'wood')
      box(
        grid,
        c - w,
        y + Math.round(storey / 2) - 1,
        c - w,
        c + w,
        y + Math.round(storey / 2) - 1,
        c + w,
        'cloth',
      )
      const e = w + 2
      box(grid, c - e, y + storey - 1, c - e, c + e, y + storey - 1, c + e, 'roof')
      box(grid, c - e + 1, y + storey, c - e + 1, c + e - 1, y + storey, c + e - 1, 'roof')
      for (const [dx, dz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const)
        grid.set(c + dx * e, y + storey, c + dz * e, 'roof')
      y += storey + 1
    }
    // Spire with rings.
    box(grid, c, y, c, c, y + storey + 2, c, 'roof')
    for (let r = y + 1; r < y + storey + 1; r += 2) box(grid, c - 1, r, c - 1, c + 1, r, c + 1, 'accent')

    // Stone path to the front edge, lanterns either side, maples in the corners.
    for (let z = c + half + 3; z < size - 1; z++) box(grid, c - 1, 1, z, c + 1, 1, z, 'stone')
    const lz = Math.min(size - 4, c + half + 6)
    lantern(grid, c - 4, 2, lz)
    lantern(grid, c + 4, 2, lz)
    for (let i = Math.max(2, detail(size, 1.5)); i > 0; i--) {
      const x = rng.chance(0.5) ? rng.int(2, c - half - 5) : rng.int(c + half + 5, size - 3)
      const z = rng.int(3, size - 4)
      if (grid.topY(x, z) > 1) continue
      growTree(grid, rng, x, 2, z, {
        height: rng.int(4, Math.max(5, Math.round(size * 0.18))),
        canopy: Math.max(2, Math.round(size * 0.06)),
        thick: 1,
        leaf: 'accent',
        branches: [3, 4],
      })
    }
    // White temple wall with a tiled cap along the back.
    box(grid, 0, 2, 0, size - 1, 4, 0, 'cloth')
    box(grid, 0, 5, 0, size - 1, 5, 1, 'roof')
    decorate(grid, rng)
    return grid
  },
}
