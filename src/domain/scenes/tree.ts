import { VoxelGrid } from '../voxels'
import { blob, decorate, detail, growTree, scatter } from './shapes'
import type { SceneDef } from './types'

/** A grassy island with one big bushy tree: lean, branches, crown size and stones all come from the seed. */
export const tree: SceneDef = {
  group: 'nature',
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

    // A tall, airy crown of many leaf clusters on long branches, like a big old garden tree.
    // Branch count follows the QR area, so long links grow fuller trees.
    const height = Math.round(size * (0.42 + rng.next() * 0.1))
    const canopy = Math.max(4, Math.round(size * (0.1 + rng.next() * 0.03)))
    growTree(grid, rng, Math.round(mid), 3, Math.round(mid), {
      height,
      canopy,
      thick: Math.max(1, Math.round(size / 22)),
      leaf: 'leaf',
      branches: [Math.max(7, detail(size, 3)), Math.max(9, detail(size, 4))],
      reach: 1.8,
      flat: 0.8,
    })
    // A dense core so the clusters read as one bushy crown, not separate balls.
    blob(grid, [Math.round(mid), 3 + Math.round(height * 0.9), Math.round(mid)], canopy * 1.5, 'leaf', 0.7)
    scatter(grid, rng, detail(size, rng.int(2, 4)), 'stone', ['grass'])
    decorate(grid, rng)
    return grid
  },
}
