import { VoxelGrid } from '../voxels'
import { blob, box, slab } from './shapes'
import type { SceneDef } from './types'

/** Raked sand with ripples around mossy rocks, inside a low wooden border. */
export const zengarden: SceneDef = {
  id: 'zengarden',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'sand')
    const rocks = Array.from({ length: rng.int(3, 5) }, () => ({
      x: rng.int(size * 0.2, size * 0.8),
      z: rng.int(size * 0.2, size * 0.8),
      r: rng.int(2, Math.max(2, Math.round(size * 0.08))),
    }))
    const straight = rng.chance(0.5)

    // Rake lines: ripples circle each rock, straight lines everywhere else.
    for (let z = 1; z < size - 1; z++)
      for (let x = 1; x < size - 1; x++) {
        const near = rocks.map((r) => Math.hypot(x - r.x, z - r.z) - r.r).reduce((a, b) => Math.min(a, b))
        const ridge = near < 6 ? Math.round(near) % 2 === 0 : (straight ? z : x + z) % 2 === 0
        if (ridge) grid.set(x, 1, z, 'sand')
      }

    for (const r of rocks) {
      blob(grid, [r.x, 1 + r.r * 0.4, r.z], r.r, 'stone', 0.8, 25)
      // Moss ring at the foot of each rock.
      for (let a = 0; a < Math.PI * 2; a += 0.3)
        if (rng.chance(0.6))
          grid.set(
            Math.round(r.x + Math.cos(a) * (r.r + 1)),
            1,
            Math.round(r.z + Math.sin(a) * (r.r + 1)),
            'grass',
          )
    }

    // Wooden border, with a small shrub in one corner.
    box(grid, 0, 1, 0, size - 1, 2, 0, 'wood')
    box(grid, 0, 1, size - 1, size - 1, 2, size - 1, 'wood')
    box(grid, 0, 1, 0, 0, 2, size - 1, 'wood')
    box(grid, size - 1, 1, 0, size - 1, 2, size - 1, 'wood')
    const corner = rng.pick([
      [3, 3],
      [size - 4, 3],
      [3, size - 4],
      [size - 4, size - 4],
    ] as const)
    blob(grid, [corner[0], 3, corner[1]], Math.max(2, Math.round(size * 0.07)), 'leaf', 0.7)
    return grid
  },
}
