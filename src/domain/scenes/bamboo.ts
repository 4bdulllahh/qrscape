import { VoxelGrid } from '../voxels'
import { blob, slab } from './shapes'
import type { SceneDef } from './types'

/** Tall swaying bamboo in clumps, with a stepping-stone path winding through. */
export const bamboo: SceneDef = {
  id: 'bamboo',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')

    // Stepping stones on a gentle S-curve from one side to the other.
    const along = rng.chance(0.5)
    const phase = rng.next() * Math.PI * 2
    const pathAt = (t: number) => Math.round(size / 2 + Math.sin(t / 6 + phase) * size * 0.15)
    for (let t = 1; t < size - 1; t += 3) {
      const p = pathAt(t)
      for (let w = -1; w <= 0; w++) {
        const [x, z] = along ? [t, p + w] : [p + w, t]
        grid.set(x, 2, z, 'stone')
        grid.set(x + (along ? 1 : 0), 2, z + (along ? 0 : 1), 'stone')
      }
    }

    const clumps = rng.int(7, 10)
    for (let i = 0; i < clumps; i++) {
      const cx = rng.int(2, size - 3)
      const cz = rng.int(2, size - 3)
      for (let k = rng.int(4, 8); k > 0; k--) {
        const x = cx + rng.int(-2, 2)
        const z = cz + rng.int(-2, 2)
        const t = along ? x : z
        const across = along ? z : x
        if (Math.abs(across - pathAt(t)) < 3 || grid.topY(x, z) > 1) continue
        const h = Math.round(size * (0.4 + rng.next() * 0.4))
        // Stalk with a pale ring every 4 voxels, leaves bunched at the top.
        for (let y = 2; y < 2 + h; y++) grid.set(x, y, z, (y - 2) % 4 === 3 ? 'grass' : 'leaf')
        blob(grid, [x + rng.int(-1, 1), 2 + h, z + rng.int(-1, 1)], rng.int(1, 2), 'leaf', 0.6, 40)
      }
    }
    return grid
  },
}
