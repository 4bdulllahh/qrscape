import { VoxelGrid } from '../voxels'
import { box, slab } from './shapes'
import type { SceneDef } from './types'

/** A ramen cart on wheels: canopy roof, noren, red lanterns, stools and a steaming bowl. */
export const ramenstall: SceneDef = {
  group: 'city',
  id: 'ramenstall',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'stone')
    const c = Math.round((size - 1) / 2)
    const hw = Math.round(size * (0.22 + rng.next() * 0.05))
    const hd = Math.round(size * (0.1 + rng.next() * 0.03))
    const x0 = c - hw
    const x1 = c + hw
    const z0 = c - hd - 2
    const z1 = c + hd - 2
    const counter = 6

    // Cart body on two wheels (discs standing upright on the sides).
    box(grid, x0, 3, z0, x1, counter - 1, z1, 'wood')
    for (const x of [x0 - 1, x1 + 1])
      for (let y = 1; y <= 5; y++)
        for (let z = z0; z <= z1; z++)
          if (Math.hypot(y - 3, z - (z0 + z1) / 2) <= 2.5) grid.set(x, y, z, 'trunk')
    box(grid, x0 - 1, counter, z0, x1 + 1, counter, z1 + 2, 'wood')

    // Corner posts holding a canopy roof, noren strips along the front, lanterns at the corners.
    const roof = counter + rng.int(7, 9)
    for (const [x, z] of [
      [x0, z0],
      [x1, z0],
      [x0, z1],
      [x1, z1],
    ] as const)
      box(grid, x, counter + 1, z, x, roof - 1, z, 'wood')
    box(grid, x0 - 2, roof, z0 - 2, x1 + 2, roof, z1 + 3, 'roof')
    box(grid, x0 - 1, roof + 1, z0 - 1, x1 + 1, roof + 1, z1 + 2, 'roof')
    for (let x = x0; x <= x1; x++)
      if ((x - x0) % 3 !== 2) box(grid, x, roof - 2, z1 + 2, x, roof - 1, z1 + 2, 'cloth')
    for (const x of [x0 - 2, x1 + 2]) box(grid, x, roof - 4, z1 + 3, x, roof - 2, z1 + 3, 'accent')

    // A bowl on the counter with steam rising in puffs.
    const bx = c + rng.int(-hw + 2, hw - 2)
    box(grid, bx - 1, counter + 1, z1 + 1, bx + 1, counter + 1, z1 + 1, 'pot')
    for (let y = counter + 3; y < roof - 4; y += 2) grid.set(bx + rng.int(-1, 1), y, z1 + 1, 'snow')

    // Stools in front of the counter.
    for (let x = x0 + 1; x <= x1 - 1; x += 4) {
      box(grid, x, 1, z1 + 5, x, 3, z1 + 5, 'wood')
      box(grid, x - 1, 4, z1 + 4, x + 1, 4, z1 + 6, 'wood')
    }
    return grid
  },
}
