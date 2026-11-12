import { VoxelGrid } from '../voxels'
import { box, decorate, detail, growTree, scatter, slab } from './shapes'
import type { SceneDef } from './types'

/** A wide pink blossom tree over a lawn with fallen petals and a wooden bench. */
export const cherryblossom: SceneDef = {
  group: 'nature',
  id: 'cherryblossom',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const mid = Math.round((size - 1) / 2)
    const tx = mid + rng.int(-3, 3)
    const tz = mid + rng.int(-3, 3)

    growTree(grid, rng, tx, 2, tz, {
      height: Math.round(size * (0.28 + rng.next() * 0.08)),
      canopy: Math.max(3, Math.round(size * (0.15 + rng.next() * 0.04))),
      thick: size >= 33 ? 2 : 1,
      leaf: 'petal',
      flat: 0.55,
      branches: [4, 6],
    })
    scatter(grid, rng, detail(size, 40), 'petal', ['grass'])

    // Bench facing the tree: seat on two legs.
    const bx = rng.chance(0.5) ? 3 : size - 9
    const bz = rng.int(3, size - 4)
    box(grid, bx, 2, bz, bx, 2, bz, 'wood')
    box(grid, bx + 5, 2, bz, bx + 5, 2, bz, 'wood')
    box(grid, bx, 3, bz, bx + 5, 3, bz, 'wood')
    decorate(grid, rng)
    return grid
  },
}
