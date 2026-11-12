import { VoxelGrid } from '../voxels'
import { box, cylinder, slab } from './shapes'
import type { SceneDef } from './types'

/** An old wooden tofu shop: gable roof, noren curtain, a red lantern, a water tub and crates of tofu. */
export const tofushop: SceneDef = {
  group: 'city',
  id: 'tofushop',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'stone')
    const c = Math.round((size - 1) / 2)
    const hw = Math.round(size * (0.26 + rng.next() * 0.06))
    const x0 = c - hw
    const x1 = c + hw
    const z0 = 2
    const z1 = Math.round(size * (0.45 + rng.next() * 0.05))
    const top = Math.round(size * (0.22 + rng.next() * 0.06))

    box(grid, x0, 1, z0, x1, top, z1, 'wood')
    box(grid, x0 + 1, 1, z0 + 1, x1 - 1, top, z1 - 1, null)
    // Gable roof: steps up from front and back to a ridge, overhanging the sides.
    const mid = Math.round((z0 + z1) / 2)
    for (let i = 0; z0 - 2 + i <= mid; i++) {
      box(grid, x0 - 2, top + 1 + i, z0 - 2 + i, x1 + 2, top + 1 + i, z0 - 2 + i, 'roof')
      box(grid, x0 - 2, top + 1 + i, z1 + 2 - i, x1 + 2, top + 1 + i, z1 + 2 - i, 'roof')
    }

    // Doorway with a noren curtain in strips, and a lantern beside it.
    const door = c + rng.int(-2, 2)
    box(grid, door - 2, 1, z1, door + 2, top - 1, z1, null)
    for (let x = door - 2; x <= door + 2; x++)
      if (x !== door) box(grid, x, top - 3, z1 + 1, x, top - 1, z1 + 1, 'cloth')
    const lx = door + (rng.chance(0.5) ? 4 : -4)
    box(grid, lx, top - 4, z1 + 1, lx, top - 2, z1 + 1, 'accent')
    box(grid, x0 + 2, top - 1, z1 + 1, x0 + 5, top - 1, z1 + 1, 'cloth')

    // Bench with crates of white tofu blocks, and a wooden tub of water.
    const bz = z1 + 4
    box(grid, x0 + 1, 1, bz, x0 + 1, 1, bz + 1, 'wood')
    box(grid, x0 + 7, 1, bz, x0 + 7, 1, bz + 1, 'wood')
    box(grid, x0 + 1, 2, bz, x0 + 7, 2, bz + 1, 'wood')
    for (let x = x0 + 2; x <= x0 + 6; x += 2) {
      box(grid, x, 3, bz, x + 1, 3, bz + 1, 'wood')
      grid.set(x, 4, bz, 'snow')
      if (rng.chance(0.7)) grid.set(x + 1, 4, bz + 1, 'snow')
    }
    const tx = x1 - 3
    const tz = bz + rng.int(1, 3)
    cylinder(grid, tx, tz, 1, 3, 2.4, 'wood')
    cylinder(grid, tx, tz, 3, 3, 1.5, 'water')
    return grid
  },
}
