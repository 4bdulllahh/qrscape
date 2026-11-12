import type { Rng } from '../seed'
import { type Material, VoxelGrid } from '../voxels'
import { blob, box, detail, scatter, slab, type Vec } from './shapes'
import type { SceneDef } from './types'

const KINDS = ['pine', 'maple', 'juniper', 'azalea'] as const

/** A trunk segment `thick` voxels wide, from a to b. */
function limb(grid: VoxelGrid, a: Vec, b: Vec, thick: number, material: Material = 'trunk'): void {
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]), 1)
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const x = Math.round(a[0] + (b[0] - a[0]) * t)
    const y = Math.round(a[1] + (b[1] - a[1]) * t)
    const z = Math.round(a[2] + (b[2] - a[2]) * t)
    box(grid, x, y, z, x + thick - 1, y, z + thick - 1, material)
  }
}

/** Point a share of the way along a trunk made of segments. */
function along(path: Vec[], share: number): Vec {
  const i = Math.min(path.length - 2, Math.floor(share * (path.length - 1)))
  const t = share * (path.length - 1) - i
  const a = path[i] as Vec
  const b = path[i + 1] as Vec
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function drawPath(grid: VoxelGrid, path: Vec[], thick: number): void {
  for (let i = 0; i < path.length - 1; i++)
    limb(grid, path[i] as Vec, path[i + 1] as Vec, i === 0 ? thick + 1 : thick)
}

/** Flat "cloud" pads on short side branches: the classic bonsai look. */
function pads(
  grid: VoxelGrid,
  rng: Rng,
  path: Vec[],
  count: number,
  r: number,
  leaf: Material,
  flat: number,
): void {
  let side = rng.chance(0.5) ? 1 : -1
  for (let i = 0; i < count; i++) {
    const share = i / Math.max(1, count - 1)
    const from = along(path, 0.3 + 0.6 * share)
    const angle = rng.next() * Math.PI * 0.5 + (side > 0 ? -Math.PI / 4 : (Math.PI * 3) / 4)
    // Lower pads reach furthest, so the tree reads as a wide triangle.
    const reach = r * (2.6 - 1.4 * share + rng.next() * 0.4)
    const end: Vec = [
      Math.round(from[0] + Math.cos(angle) * reach),
      from[1] + rng.int(0, 2),
      Math.round(from[2] + Math.sin(angle) * reach),
    ]
    limb(grid, from, end, 1)
    blob(grid, end, r * (0.85 + rng.next() * 0.3), leaf, flat, 25)
    side = -side
  }
}

/** A real bonsai in a shallow pot on a table: pine, maple, juniper cascade or flowering azalea, picked by the seed. */
export const bonsai: SceneDef = {
  group: 'nature',
  id: 'bonsai',
  creatures: ['butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    const mid = Math.round((size - 1) / 2)
    slab(grid, 0, 0, 'wood')

    // Shallow, wide pot with feet and a lip, filled with moss.
    const hw = Math.round(size * (0.27 + rng.next() * 0.05))
    const hd = Math.round(size * (0.17 + rng.next() * 0.04))
    const rim = 3
    for (const fx of [-1, 1])
      for (const fz of [-1, 1])
        box(
          grid,
          mid + fx * (hw - 2),
          1,
          mid + fz * (hd - 2),
          mid + fx * (hw - 2),
          1,
          mid + fz * (hd - 2),
          'pot',
        )
    box(grid, mid - hw + 1, 2, mid - hd + 1, mid + hw - 1, rim - 1, mid + hd - 1, 'pot')
    box(grid, mid - hw, rim, mid - hd, mid + hw, rim, mid + hd, 'pot')
    box(grid, mid - hw + 1, rim, mid - hd + 1, mid + hw - 1, rim, mid + hd - 1, 'soil')
    box(grid, mid - hw + 1, rim + 1, mid - hd + 1, mid + hw - 1, rim + 1, mid + hd - 1, 'grass')
    scatter(grid, rng, detail(size, 2), 'stone', ['grass'])

    const kind = rng.pick(KINDS)
    const h = Math.round(size * (0.38 + rng.next() * 0.07))
    const r = Math.max(3, Math.round(size * (0.1 + rng.next() * 0.02)))
    const thick = size >= 33 ? 2 : 1
    const base: Vec = [mid + rng.int(-3, 3), rim + 2, mid + rng.int(-1, 1)]
    const lean = rng.chance(0.5) ? 1 : -1
    const padCount = Math.min(8, Math.max(3, detail(size, 2)))
    // Root flare: the trunk spreads where it meets the moss.
    box(grid, base[0] - 1, base[1], base[2] - 1, base[0] + thick, base[1], base[2] + thick, 'trunk')

    if (kind === 'pine') {
      // S-curved trunk, tiers of flat pads, one crown pad.
      const path: Vec[] = [
        base,
        [base[0] + lean * Math.round(h * 0.25), base[1] + Math.round(h * 0.35), base[2]],
        [base[0] - lean * Math.round(h * 0.1), base[1] + Math.round(h * 0.7), base[2] + rng.int(-1, 1)],
        [base[0] + lean * Math.round(h * 0.05), base[1] + h, base[2]],
      ]
      drawPath(grid, path, thick)
      pads(grid, rng, path, padCount, r, 'leaf', 0.28)
      blob(grid, path[3] as Vec, r * 1.1, 'leaf', 0.4, 25)
    } else if (kind === 'maple') {
      // Upright trunk opening into a round red dome.
      const top: Vec = [base[0] + lean * rng.int(0, 2), base[1] + Math.round(h * 0.6), base[2]]
      limb(grid, base, top, thick + 1)
      for (let i = 0; i < padCount; i++) {
        const a = (i / padCount) * Math.PI * 2 + rng.next() * 0.5
        const end: Vec = [
          Math.round(top[0] + Math.cos(a) * r * 1.3),
          top[1] + rng.int(1, Math.round(r * 0.8)),
          Math.round(top[2] + Math.sin(a) * r),
        ]
        limb(grid, top, end, 1)
        blob(grid, end, r * 0.9, 'accent', 0.6, 30)
      }
      blob(grid, [top[0], top[1] + Math.round(r * 0.8), top[2]], r * 1.5, 'accent', 0.6, 30)
    } else if (kind === 'juniper') {
      // Cascade: the trunk climbs, bends out over the pot's edge and falls below the rim. Bare white deadwood on top.
      const out = base[0] + lean * (hw + 3)
      const path: Vec[] = [
        base,
        [base[0] - lean * 2, base[1] + Math.round(h * 0.45), base[2]],
        [base[0] + lean * Math.round(hw * 0.8), base[1] + Math.round(h * 0.55), base[2]],
        [out, rim + 1, base[2] + rng.int(-1, 1)],
        [out + lean * 2, 2, base[2]],
      ]
      drawPath(grid, path, thick)
      for (let i = 0; i < padCount; i++) {
        const at = along(path, 0.45 + (0.55 * i) / Math.max(1, padCount - 1))
        blob(grid, [at[0], at[1] + 1, at[2] + rng.int(-2, 2)], r * (0.8 + rng.next() * 0.25), 'leaf', 0.3, 25)
      }
      const bend = path[1] as Vec
      limb(grid, bend, [bend[0] - lean * 2, bend[1] + Math.round(h * 0.3), bend[2]], 1, 'snow')
    } else {
      // Azalea: short trunk, wide low dome covered in flowers.
      const top: Vec = [base[0], base[1] + Math.round(h * 0.3), base[2]]
      limb(grid, base, top, thick + 1)
      blob(grid, [top[0], top[1] + r, top[2]], r * 1.9, 'leaf', 0.55, 20)
      for (let i = 0; i < padCount; i++) {
        const a = rng.next() * Math.PI * 2
        blob(
          grid,
          [
            Math.round(top[0] + Math.cos(a) * r * 1.4),
            top[1] + rng.int(0, r),
            Math.round(top[2] + Math.sin(a) * r),
          ],
          r,
          'leaf',
          0.6,
          30,
        )
      }
      for (let z = 0; z < size; z++)
        for (let x = 0; x < size; x++) {
          const y = grid.topY(x, z)
          if (grid.get(x, y, z) === 'leaf' && rng.chance(0.35)) grid.set(x, y, z, 'petal')
        }
    }
    return grid
  },
}
