import { VoxelGrid } from '../voxels'
import { blob, box, slab } from './shapes'
import type { SceneDef } from './types'

/** A little corner café: big window, striped awning, tables with cups outside, plants by the door. */
export const coffeeshop: SceneDef = {
  group: 'city',
  id: 'coffeeshop',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'stone')
    const c = Math.round((size - 1) / 2)
    const hw = Math.round(size * (0.28 + rng.next() * 0.06))
    const x0 = c - hw
    const x1 = c + hw
    const z0 = 2
    const z1 = Math.round(size * 0.45)
    const top = Math.round(size * (0.3 + rng.next() * 0.08))

    // Walls with a wooden base strip, a front window and a door, and a flat roof with a ledge.
    box(grid, x0, 1, z0, x1, top, z1, 'cloth')
    box(grid, x0 + 1, 1, z0 + 1, x1 - 1, top, z1 - 1, null)
    box(grid, x0, 1, z1, x1, 1, z1, 'wood')
    const door = c + rng.int(-hw + 3, hw - 3)
    box(grid, x0 + 2, 3, z1, x1 - 2, top - 3, z1, 'glass')
    box(grid, door - 1, 1, z1, door + 1, top - 3, z1, null)
    box(grid, x0 - 1, top + 1, z0 - 1, x1 + 1, top + 1, z1 + 1, 'roof')
    box(grid, x0, top + 1, z0, x1, top + 1, z1, 'wood')
    box(grid, c - 3, top - 1, z1 + 1, c + 3, top, z1 + 1, 'accent')

    // Striped awning sloping out over the window.
    for (let k = 0; k < 3; k++)
      for (let x = x0; x <= x1; x++) grid.set(x, top - 3 - k, z1 + 1 + k, x % 2 === 0 ? 'accent' : 'cloth')

    // Tables with a cup on each, and two potted plants beside the door.
    const tables = rng.int(2, 3)
    for (let i = 0; i < tables; i++) {
      const tx = x0 + 2 + Math.round(((i + 0.5) / tables) * (x1 - x0 - 4))
      const tz = z1 + 6 + rng.int(0, Math.max(0, size - z1 - 10))
      box(grid, tx, 1, tz, tx, 2, tz, 'wood')
      box(grid, tx - 1, 3, tz - 1, tx + 1, 3, tz + 1, 'wood')
      grid.set(tx + rng.int(-1, 1), 4, tz, 'snow')
      box(grid, tx - 3, 1, tz, tx - 3, 1, tz, 'wood')
      box(grid, tx - 3, 2, tz - 1, tx - 3, 3, tz + 1, 'wood')
    }
    for (const x of [door - 3, door + 3]) {
      box(grid, x, 1, z1 + 1, x, 2, z1 + 1, 'pot')
      blob(grid, [x, 4, z1 + 1], 1.6, 'leaf', 0.9, 20)
    }
    return grid
  },
}
