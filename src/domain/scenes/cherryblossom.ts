import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, growTree, scatter, slab } from './shapes'
import type { SceneDef } from './types'

/** A chunky old blossom tree over a lawn with falling and fallen petals and a wooden bench. */
export const cherryblossom: SceneDef = {
  group: 'nature',
  id: 'cherryblossom',
  creatures: ['petal', 'butterfly', 'bird'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const mid = Math.round((size - 1) / 2)
    const tx = mid + rng.int(-3, 3)
    const tz = mid + rng.int(-3, 3)

    // Chunky old tree: thick trunk, wide spreading crown of many blossom clusters and a dense core.
    const height = Math.round(size * (0.3 + rng.next() * 0.08))
    const canopy = Math.max(4, Math.round(size * (0.11 + rng.next() * 0.03)))
    const thick = Math.max(2, Math.round(size / 18))
    growTree(grid, rng, tx, 2, tz, {
      height,
      canopy,
      thick,
      leaf: 'petal',
      flat: 0.6,
      branches: [Math.max(7, detail(size, 3)), Math.max(9, detail(size, 4))],
      reach: 1.9,
    })
    box(grid, tx - 1, 2, tz - 1, tx + thick, 2, tz + thick, 'trunk')
    blob(grid, [tx, 2 + Math.round(height * 0.95), tz], canopy * 1.6, 'petal', 0.6)
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
