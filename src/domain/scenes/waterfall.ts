import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, hash3, slab } from './shapes'
import { conifer } from './pine'
import type { SceneDef } from './types'

/**
 * A waterfall: a river runs across a grassy cliff top, pours down the rock face into a misty plunge pool,
 * then winds away to the front. Pines on both levels, rocks in the spray.
 */
export const waterfall: SceneDef = {
  group: 'nature',
  id: 'waterfall',
  creatures: ['steam', 'bird', 'dragonfly', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, Math.round(size * 1.05))
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const back = Math.round(size * (0.32 + rng.next() * 0.06))
    const H = Math.round(size * (0.38 + rng.next() * 0.08))
    const fx = Math.round(size / 2 + rng.int(-3, 3))
    const fw = Math.max(2, Math.round(size / 14))

    // Cliff: rock with a ragged face, grass on top.
    for (let z = 0; z <= back; z++)
      for (let x = 0; x < size; x++) {
        const h = H - (hash3(x, 0, z) % 3 === 0 ? 1 : 0) - (z === back && hash3(x, 1, z) < 50 ? 2 : 0)
        box(grid, x, 1, z, x, h - 1, z, 'stone')
        grid.set(x, h, z, 'grass')
      }
    // River on the cliff top and the falls down the face.
    for (let z = 0; z <= back; z++) {
      const wx = fx + Math.round(Math.sin(z / 4 + rng.next() * 0.2) * 2)
      box(grid, wx - fw, H - 1, z, wx + fw, H, z, null)
      box(grid, wx - fw, H - 1, z, wx + fw, H - 1, z, 'water')
    }
    box(grid, fx - fw, 1, back + 1, fx + fw, H - 1, back + 1, 'water')

    // Plunge pool with a rocky rim, and the stream winding to the front edge.
    const pr = size * (0.16 + rng.next() * 0.04)
    const pz = back + 1 + pr * 0.8
    for (let z = back + 1; z < size; z++)
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - fx, (z - pz) * 1.15)
        const sx = fx + Math.sin(z / 5) * 3
        const stream = z > pz && Math.abs(x - sx) <= fw
        if (d < pr || stream) {
          grid.set(x, 1, z, 'water')
          grid.set(x, 0, z, 'soil')
        } else if (d < pr + 1.5) grid.set(x, 1 + (hash3(x, 2, z) < 45 ? 1 : 0), z, 'stone')
      }
    for (let i = detail(size, 2); i > 0; i--) {
      const x = Math.round(fx + rng.int(-Math.round(pr), Math.round(pr)))
      const z = Math.round(pz + rng.int(-2, 2))
      if (grid.get(x, 1, z) === 'water' && Math.abs(x - fx) > fw) blob(grid, [x, 1, z], 1.2, 'stone', 0.8, 20)
    }

    // Pines on the cliff top and on the bank, more on long links.
    for (let i = Math.max(3, detail(size, 2)); i > 0; i--) {
      const top = rng.chance(0.5)
      const x = rng.int(2, size - 3)
      const z = top ? rng.int(1, back - 3) : rng.int(back + 3, size - 3)
      const y = grid.topY(x, z)
      if (grid.get(x, y, z) !== 'grass' || Math.abs(x - fx) < fw + 3) continue
      conifer(grid, rng, x, y + 1, z, rng.int(5, Math.max(6, Math.round(size * 0.22))), rng.int(2, 3), 1)
    }
    decorate(grid, rng)
    return grid
  },
}
