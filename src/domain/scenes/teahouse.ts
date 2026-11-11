import { VoxelGrid } from '../voxels'
import { blob, box, slab } from './shapes'
import type { SceneDef } from './types'

/** A small raised tea house: paper walls in a wooden frame, a stepped tiled roof and a stone path. */
export const teahouse: SceneDef = {
  id: 'teahouse',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const c = Math.round((size - 1) / 2)
    const hw = Math.round(size * (0.2 + rng.next() * 0.06))
    const hd = Math.round(size * (0.15 + rng.next() * 0.05))
    const x0 = c - hw
    const x1 = c + hw
    const z0 = c - hd - 2
    const z1 = c + hd - 2
    const floor = 3
    const wallTop = floor + rng.int(4, 5)

    // Posts under a veranda one voxel wider than the walls.
    for (const [x, z] of [
      [x0 - 1, z0 - 1],
      [x1 + 1, z0 - 1],
      [x0 - 1, z1 + 1],
      [x1 + 1, z1 + 1],
    ] as const)
      box(grid, x, 2, z, x, floor - 1, z, 'wood')
    box(grid, x0 - 1, floor, z0 - 1, x1 + 1, floor, z1 + 1, 'wood')

    // Paper walls with a wooden post every 3 voxels, and an open doorway facing the path.
    box(grid, x0, floor + 1, z0, x1, wallTop, z1, 'cloth')
    box(grid, x0 + 1, floor + 1, z0 + 1, x1 - 1, wallTop, z1 - 1, null)
    for (let x = x0; x <= x1; x += 3) {
      box(grid, x, floor + 1, z0, x, wallTop, z0, 'wood')
      box(grid, x, floor + 1, z1, x, wallTop, z1, 'wood')
    }
    box(grid, c - 1, floor + 1, z1, c + 1, wallTop - 1, z1, null)

    // Hipped roof: each layer steps in by one until it closes.
    for (let i = 0; ; i++) {
      const ax = x0 - 2 + i
      const bx = x1 + 2 - i
      const az = z0 - 2 + i
      const bz = z1 + 2 - i
      if (ax > bx || az > bz) break
      box(grid, ax, wallTop + 1 + i, az, bx, wallTop + 1 + i, bz, 'roof')
    }

    // Stepping stones from the door to the front edge, and a round bush.
    for (let z = z1 + 3; z < size - 1; z += 2) box(grid, c - 1, 2, z, c, 2, z, 'stone')
    blob(grid, [rng.chance(0.5) ? 4 : size - 5, 3, size - 5], Math.max(2, Math.round(size * 0.07)), 'leaf')
    return grid
  },
}
