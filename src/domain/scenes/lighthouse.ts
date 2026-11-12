import { VoxelGrid } from '../voxels'
import { blob, box, cylinder, decorate, hash3, slab } from './shapes'
import type { SceneDef } from './types'

/** A small rocky island in the sea with a striped lighthouse and a keeper's cottage. */
export const lighthouse: SceneDef = {
  group: 'nature',
  id: 'lighthouse',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'water')
    const c = (size - 1) / 2
    const R = size * (0.3 + rng.next() * 0.06)
    const wobble = rng.next() * Math.PI * 2

    // Island: rocky cliffs, a sandy rim at the waterline, grass on top.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const a = Math.atan2(z - c, x - c)
        const edge = R * (1 + 0.18 * Math.sin(a * 3 + wobble))
        const d = Math.hypot(x - c, z - c)
        if (d > edge) continue
        if (d > edge - 1.5) {
          grid.set(x, 0, z, 'sand')
          continue
        }
        box(grid, x, 0, z, x, 2, z, 'stone')
        grid.set(x, 3, z, hash3(x, 3, z) < 12 ? 'stone' : 'grass')
      }

    // Lighthouse: striped tower, glass lamp room, dark cap.
    const lx = Math.round(c + rng.int(-2, 2))
    const lz = Math.round(c + rng.int(-2, 2))
    const r = size >= 33 ? 2.6 : 2
    const h = Math.round(size * (0.42 + rng.next() * 0.1))
    const band = rng.int(2, 3)
    for (let y = 4; y < 4 + h; y++)
      cylinder(grid, lx, lz, y, y, r, Math.floor((y - 4) / band) % 2 === 0 ? 'snow' : 'accent')
    cylinder(grid, lx, lz, 4 + h, 4 + h, r + 1, 'roof')
    cylinder(grid, lx, lz, 5 + h, 6 + h, r - 0.5, 'glass')
    cylinder(grid, lx, lz, 7 + h, 7 + h, r, 'roof')
    grid.set(lx, 8 + h, lz, 'roof')

    // Keeper's cottage with a pitched roof, and a shrub.
    const hx = Math.round(c + (rng.chance(0.5) ? -1 : 1) * R * 0.45)
    const hz = Math.round(c + R * 0.35)
    box(grid, hx - 2, 4, hz - 2, hx + 2, 6, hz + 2, 'wood')
    for (let i = 0; i <= 3; i++) box(grid, hx - 3 + i, 7 + i, hz - 3, hx + 3 - i, 7 + i, hz + 3, 'roof')
    blob(grid, [Math.round(c - R * 0.4), 5, Math.round(c - R * 0.3)], 2, 'leaf')
    decorate(grid, rng)
    return grid
  },
}
