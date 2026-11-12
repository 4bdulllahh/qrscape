import type { Rng } from '../seed'
import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, hash3, slab } from './shapes'
import type { SceneDef } from './types'

/** A conifer: straight trunk with drooping tiers of needles that shrink to a point. */
export function conifer(
  grid: VoxelGrid,
  rng: Rng,
  x: number,
  base: number,
  z: number,
  h: number,
  r: number,
  thick: number,
): void {
  box(grid, x, base, z, x + thick - 1, base + h, z + thick - 1, 'trunk')
  const cx = x + (thick - 1) / 2
  const cz = z + (thick - 1) / 2
  const tiers = Math.max(3, Math.round(h / 3.2))
  for (let i = 0; i < tiers; i++) {
    const y = base + Math.round(h * 0.25) + Math.round(((h * 0.78) / tiers) * i)
    const tr = r * (1 - i / tiers) + 0.8
    for (let dz = -Math.ceil(tr); dz <= tr; dz++)
      for (let dx = -Math.ceil(tr); dx <= tr; dx++) {
        const d = Math.hypot(dx, dz)
        const vx = Math.round(cx + dx)
        const vz = Math.round(cz + dz)
        if (d > tr || hash3(vx, y, vz) < 18) continue
        // Tier edges droop one voxel, the middle humps up one.
        const low = d > tr * 0.7 ? y - 1 : y
        const high = d < tr * 0.35 ? y + 1 : y
        box(grid, vx, low, vz, vx, high, vz, 'leaf')
      }
  }
  grid.set(Math.round(cx), base + h + 1, Math.round(cz), 'leaf')
  grid.set(Math.round(cx), base + h + 2, Math.round(cz), rng.chance(0.3) ? 'accent' : 'leaf')
}

/** A tall pine on a mossy forest floor, with young pines, rocks and mushrooms. Long links grow a little forest. */
export const pine: SceneDef = {
  group: 'nature',
  id: 'pine',
  creatures: ['bird', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, Math.round(size * 1.1))
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const c = Math.round((size - 1) / 2)
    const h = Math.round(size * (0.6 + rng.next() * 0.15))
    conifer(
      grid,
      rng,
      c + rng.int(-2, 2),
      2,
      c + rng.int(-2, 2),
      h,
      size * 0.2,
      Math.max(1, Math.round(size / 22)),
    )
    for (let i = detail(size, 1.2); i > 0; i--) {
      const x = rng.int(3, size - 4)
      const z = rng.int(3, size - 4)
      if (Math.hypot(x - c, z - c) < size * 0.25 || grid.topY(x, z) > 1) continue
      conifer(grid, rng, x, 2, z, rng.int(5, Math.max(6, Math.round(size * 0.25))), rng.int(2, 3), 1)
    }
    for (let i = detail(size, 2); i > 0; i--)
      blob(grid, [rng.int(2, size - 3), 2, rng.int(2, size - 3)], rng.int(1, 2), 'stone', 0.7, 25)
    // Red-capped mushrooms.
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.topY(x, z) !== 1) continue
      grid.set(x, 2, z, 'snow')
      grid.set(x, 3, z, 'accent')
    }
    decorate(grid, rng)
    return grid
  },
}
