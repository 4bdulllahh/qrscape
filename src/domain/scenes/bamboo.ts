import { type Material, VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, slab } from './shapes'
import type { SceneDef } from './types'

/** Tall swaying bamboo in clumps, a stepping-stone path winding through, and sometimes a panda. */
export const bamboo: SceneDef = {
  group: 'nature',
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

    const clumps = detail(size, rng.int(5, 7))
    for (let i = 0; i < clumps; i++) {
      const cx = rng.int(2, size - 3)
      const cz = rng.int(2, size - 3)
      // Denser clumps on bigger QRs.
      for (let k = rng.int(4, 8) + Math.round(size / 12); k > 0; k--) {
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
    // A panda munching a shoot on the path: always on big QRs, sometimes on small ones.
    if (size >= 37 || rng.chance(0.5)) {
      const t = Math.round(size / 2)
      const p = pathAt(t)
      const at = (u: number, v: number): [number, number] => (along ? [t + u, p + v] : [p + v, t + u])
      const fill = (
        u0: number,
        y0: number,
        v0: number,
        u1: number,
        y1: number,
        v1: number,
        m: Material | null,
      ) => {
        const [x0, z0] = at(u0, v0)
        const [x1, z1] = at(u1, v1)
        box(grid, Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1), m)
      }
      fill(-3, 2, -3, 3, size, 3, null) // clear any bamboo leaves out of its way
      fill(-2, 2, -2, 2, 3, 2, 'grass')
      fill(-2, 4, -2, 2, 6, 2, 'snow') // body
      fill(-2, 4, -2, -2, 5, -1, 'roof') // legs
      fill(2, 4, -2, 2, 5, -1, 'roof')
      fill(-2, 6, -1, 2, 6, 0, 'roof') // shoulder band
      fill(-1, 7, -2, 1, 9, 0, 'snow') // head
      fill(-1, 8, -2, -1, 8, -2, 'roof') // eye patches
      fill(1, 8, -2, 1, 8, -2, 'roof')
      fill(-1, 10, -1, -1, 10, -1, 'roof') // ears
      fill(1, 10, -1, 1, 10, -1, 'roof')
      fill(0, 7, -3, 0, 7, -3, 'roof') // nose
      fill(2, 5, -3, 2, 9, -3, 'leaf') // bamboo shoot in its paw
    }
    decorate(grid, rng)
    return grid
  },
}
