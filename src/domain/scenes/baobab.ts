import { VoxelGrid } from '../voxels'
import { blob, box, cylinder, decorate, detail, growTree, hash3, line, slab, type Vec } from './shapes'
import type { SceneDef } from './types'

/** A baobab on the savanna: huge bottle-shaped trunk, short stubby branches with small flat leaf tufts. */
export const baobab: SceneDef = {
  group: 'nature',
  id: 'baobab',
  creatures: ['bird', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    // Dry ground: sand with patches of grass.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) grid.set(x, 1, z, hash3(x, 1, z) < 35 ? 'grass' : 'sand')
    const c = Math.round((size - 1) / 2)
    const cx = c + rng.int(-2, 2)
    const cz = c + rng.int(-2, 2)
    const R = Math.max(2.5, size * (0.1 + rng.next() * 0.02))
    const H = Math.round(size * (0.32 + rng.next() * 0.06))
    for (let y = 2; y <= 2 + H; y++) {
      const t = (y - 2) / H
      // Fat in the middle, narrower at the top, flared at the roots.
      const r = R * (1 + 0.15 * Math.sin(t * Math.PI) - 0.3 * t) + (t < 0.08 ? 1 : 0)
      cylinder(grid, cx, cz, y, y, r, 'trunk')
    }
    const top = 2 + H
    const branches = Math.max(5, detail(size, 3))
    for (let i = 0; i < branches; i++) {
      const a = (i / branches) * Math.PI * 2 + rng.next() * 0.4
      const reach = R * (1.2 + rng.next() * 1.3)
      const end: Vec = [
        Math.round(cx + Math.cos(a) * reach),
        top + rng.int(2, Math.max(3, Math.round(R))),
        Math.round(cz + Math.sin(a) * reach),
      ]
      const from: Vec = [Math.round(cx + Math.cos(a) * R * 0.4), top, Math.round(cz + Math.sin(a) * R * 0.4)]
      line(grid, from, end, 'trunk')
      line(grid, [from[0], from[1] + 1, from[2]], end, 'trunk')
      blob(grid, [end[0], end[1] + 1, end[2]], rng.int(2, 3), 'leaf', 0.4, 30)
    }
    // Termite mounds and, on bigger QRs, a flat-topped acacia.
    for (let i = detail(size, 1); i > 0; i--) {
      const x = rng.int(2, size - 3)
      const z = rng.int(2, size - 3)
      if (Math.hypot(x - cx, z - cz) < R + 3) continue
      box(grid, x, 2, z, x + 1, 3, z + 1, 'soil')
      grid.set(x, 4, z, 'soil')
    }
    if (size >= 33)
      growTree(grid, rng, cx > c ? 5 : size - 6, 2, cz > c ? 5 : size - 6, {
        height: Math.round(size * 0.2),
        canopy: Math.round(size * 0.08),
        thick: 1,
        leaf: 'leaf',
        flat: 0.25,
        branches: [3, 4],
      })
    decorate(grid, rng)
    return grid
  },
}
