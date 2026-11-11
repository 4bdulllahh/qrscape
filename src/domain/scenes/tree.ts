import { VoxelGrid } from '../voxels'
import { growTree, scatter } from './shapes'
import type { SceneDef } from './types'

/** A grassy island with one seeded tree: lean, branch count, canopy size and stones all come from the seed. */
export const tree: SceneDef = {
  id: 'tree',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    const mid = (size - 1) / 2

    // Ground: soil with a grass top, rising into a soft mound under the tree.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - mid, z - mid) / (size / 2)
        const h = 1 + (d < 0.55 ? Math.round(2 * (1 - d / 0.55)) : 0)
        for (let y = 0; y < h; y++) grid.set(x, y, z, 'soil')
        grid.set(x, h, z, 'grass')
      }

    growTree(grid, rng, Math.round(mid), 3, Math.round(mid), {
      height: Math.round(size * (0.32 + rng.next() * 0.12)),
      canopy: Math.max(3, Math.round(size * (0.13 + rng.next() * 0.05))),
      thick: size >= 33 ? 2 : 1,
      leaf: 'leaf',
    })
    scatter(grid, rng, rng.int(2, 5), 'stone', ['grass'])
    return grid
  },
}
