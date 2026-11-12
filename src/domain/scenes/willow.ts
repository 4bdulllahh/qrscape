import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, growTree, hash3, slab } from './shapes'
import type { SceneDef } from './types'

/** A weeping willow by a pond: a dome of leaves with long curtains hanging almost to the ground. */
export const willow: SceneDef = {
  group: 'nature',
  id: 'willow',
  creatures: ['dragonfly', 'butterfly', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const c = Math.round((size - 1) / 2)
    const left = rng.chance(0.5) ? 1 : -1

    // Pond on one side, with a stone edge.
    const px = c - left * Math.round(size * 0.22)
    const pz = c + rng.int(-3, 3)
    const pr = size * (0.2 + rng.next() * 0.05)
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - px, (z - pz) * 1.2)
        if (d < pr) grid.set(x, 1, z, 'water')
        else if (d < pr + 1.2) grid.set(x, 1 + (hash3(x, 1, z) < 40 ? 1 : 0), z, 'stone')
      }

    // Short thick trunk, then the crown.
    const tx = c + left * Math.round(size * 0.12)
    const tz = c + rng.int(-2, 2)
    const h = Math.round(size * (0.38 + rng.next() * 0.08))
    const Rc = Math.max(4, size * (0.17 + rng.next() * 0.03))
    growTree(grid, rng, tx, 2, tz, {
      height: h,
      canopy: Math.round(Rc * 0.6),
      thick: Math.max(2, Math.round(size / 20)),
      leaf: 'leaf',
      branches: [4, 6],
      reach: 1.3,
      flat: 0.5,
    })
    blob(grid, [tx, 2 + h, tz], Rc * 0.9, 'leaf', 0.45, 25)

    // Curtains: strands hang from rings around the crown edge, each a slightly different length.
    const strands = Math.max(28, detail(size, 22))
    for (let i = 0; i < strands; i++) {
      const a = rng.next() * Math.PI * 2
      const r = Rc * (0.65 + rng.next() * 0.45)
      const x = Math.round(tx + Math.cos(a) * r)
      const z = Math.round(tz + Math.sin(a) * r)
      const top = 2 + h - Math.round(r * 0.25)
      const bottom = rng.int(3, 3 + Math.round(h * 0.3))
      if (grid.get(x, 1, z) === 'water' && bottom < 3) continue
      box(grid, x, bottom, z, x, top, z, 'leaf')
    }

    // A bench by the water and lily pads.
    box(grid, tx + left * 4, 2, tz + 5, tx + left * 4, 2, tz + 5, 'wood')
    box(grid, tx + left * 8, 2, tz + 5, tx + left * 8, 2, tz + 5, 'wood')
    box(
      grid,
      Math.min(tx + left * 4, tx + left * 8),
      3,
      tz + 5,
      Math.max(tx + left * 4, tx + left * 8),
      3,
      tz + 5,
      'wood',
    )
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.get(x, 1, z) === 'water' && grid.topY(x, z) === 1)
        grid.set(x, 1, z, rng.chance(0.3) ? 'petal' : 'leaf')
    }
    decorate(grid, rng)
    return grid
  },
}
