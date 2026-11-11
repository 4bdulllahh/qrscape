import { VoxelGrid } from '../voxels'
import { box, growTree, scatter, slab } from './shapes'
import type { SceneDef } from './types'

/** A twisted little tree with flat leaf pads in a wide ceramic pot on a wooden table. */
export const bonsai: SceneDef = {
  id: 'bonsai',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    const mid = Math.round((size - 1) / 2)
    slab(grid, 0, 0, 'wood')

    const hw = Math.round(size * (0.24 + rng.next() * 0.06))
    const hd = Math.round(size * (0.16 + rng.next() * 0.04))
    const potTop = rng.int(3, 4)
    // Pot: little feet, body, then a lip one voxel wider.
    box(grid, mid - hw + 1, 1, mid - hd + 1, mid + hw - 1, potTop - 1, mid + hd - 1, 'pot')
    box(grid, mid - hw, potTop, mid - hd, mid + hw, potTop, mid + hd, 'pot')
    box(grid, mid - hw + 1, potTop, mid - hd + 1, mid + hw - 1, potTop, mid + hd - 1, 'soil')
    box(grid, mid - hw + 1, potTop + 1, mid - hd + 1, mid + hw - 1, potTop + 1, mid + hd - 1, null)
    for (let i = rng.int(4, 9); i > 0; i--)
      grid.set(rng.int(mid - hw + 1, mid + hw - 1), potTop + 1, rng.int(mid - hd + 1, mid + hd - 1), 'grass')

    growTree(grid, rng, mid + rng.int(-2, 2), potTop + 1, mid, {
      height: Math.round(size * (0.22 + rng.next() * 0.1)),
      canopy: Math.max(3, Math.round(size * (0.11 + rng.next() * 0.04))),
      thick: 1,
      leaf: 'leaf',
      twist: 0.55,
      flat: 0.35,
      branches: [2, 4],
    })
    scatter(grid, rng, rng.int(1, 3), 'stone', ['soil', 'grass'])
    return grid
  },
}
