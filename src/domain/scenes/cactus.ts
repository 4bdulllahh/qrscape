import type { Rng } from '../seed'
import { VoxelGrid } from '../voxels'
import { box, cylinder, detail, scatter, slab } from './shapes'
import type { SceneDef } from './types'

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

/** Tall stem `w` wide with arms that go out then up, and a flower on top. */
function saguaro(
  grid: VoxelGrid,
  rng: Rng,
  cx: number,
  base: number,
  cz: number,
  h: number,
  w: number,
): void {
  const r = Math.floor(w / 2)
  box(grid, cx - r, base, cz - r, cx + r, base + h, cz + r, 'leaf')
  const start = rng.int(0, 3)
  for (let i = rng.int(2, 3) - 1; i >= 0; i--) {
    const [dx, dz] = DIRS[(start + i) % 4] ?? [1, 0]
    const y = base + rng.int(Math.round(h * 0.3), Math.round(h * 0.6))
    const out = r + rng.int(2, 3)
    for (let k = r + 1; k <= out; k++)
      box(grid, cx + dx * k, y, cz + dz * k, cx + dx * k, y + 1, cz + dz * k, 'leaf')
    const ax = cx + dx * out
    const az = cz + dz * out
    box(
      grid,
      ax,
      y,
      az,
      ax + (dz ? 1 : 0),
      y + Math.max(2, Math.round(h * rng.next() * 0.5)),
      az + (dx ? 1 : 0),
      'leaf',
    )
  }
  box(grid, cx - 1, base + h + 1, cz, cx + 1, base + h + 1, cz, 'petal')
  box(grid, cx, base + h + 1, cz - 1, cx, base + h + 2, cz + 1, 'petal')
}

/** Round ribbed barrel cactus with a crown of flowers. */
function barrel(grid: VoxelGrid, cx: number, base: number, cz: number, r: number): void {
  for (let y = base; y <= base + r * 1.6; y++) {
    const t = (y - base) / (r * 1.6)
    const rr = r * Math.sqrt(Math.max(0, 1 - (t - 0.35) ** 2 / 0.65 ** 2))
    for (let z = Math.floor(cz - rr); z <= cz + rr; z++)
      for (let x = Math.floor(cx - rr); x <= cx + rr; x++) {
        if (Math.hypot(x - cx, z - cz) > rr) continue
        const rib = Math.round((Math.atan2(z - cz, x - cx) / Math.PI) * 6) % 2 === 0
        grid.set(x, y, z, rib ? 'grass' : 'leaf')
      }
  }
  cylinder(
    grid,
    cx,
    cz,
    Math.round(base + r * 1.6) + 1,
    Math.round(base + r * 1.6) + 1,
    Math.max(1, r * 0.4),
    'petal',
  )
}

/** Prickly pear: flat paddles stacked on paddles, with red fruit on the top edges. */
function pear(grid: VoxelGrid, rng: Rng, x: number, y: number, z: number, size: number, depth: number): void {
  const flatX = rng.chance(0.5)
  const h = size * 1.4
  for (let dy = 0; dy <= h; dy++) {
    const half = size * Math.sqrt(Math.max(0, 1 - ((dy - h / 2) / (h / 2)) ** 2)) * 0.75
    for (let k = -Math.round(half); k <= Math.round(half); k++)
      grid.set(flatX ? x + k : x, y + dy, flatX ? z : z + k, 'leaf')
  }
  const top = y + Math.round(h)
  if (depth === 0 || size < 2) {
    grid.set(x, top + 1, z, 'accent')
    return
  }
  for (const s of [-1, 1])
    if (rng.chance(0.8)) {
      const off = Math.round(size * 0.5) * s
      pear(grid, rng, flatX ? x + off : x, top - 1, flatX ? z : z + off, size * 0.75, depth - 1)
    }
}

/**
 * A cactus on a table. Small QRs grow a saguaro or a barrel in a terracotta pot. Bigger QRs can also grow a
 * prickly pear, or a cactus garden: a shallow bonsai pot with several small cacti, succulents and white pebbles.
 */
export const cactus: SceneDef = {
  group: 'nature',
  id: 'cactus',
  creatures: ['butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'wood')
    const c = (size - 1) / 2
    const cx = Math.round(c)
    const kind = rng.pick(
      size >= 37 ? (['saguaro', 'barrel', 'pear', 'garden'] as const) : (['saguaro', 'barrel'] as const),
    )

    if (kind === 'garden') {
      // Shallow rectangular pot covered in sand and white pebbles.
      const hw = Math.round(size * 0.32)
      const hd = Math.round(size * 0.22)
      box(grid, cx - hw, 1, cx - hd, cx + hw, 3, cx + hd, 'pot')
      box(grid, cx - hw + 1, 3, cx - hd + 1, cx + hw - 1, 3, cx + hd - 1, 'sand')
      scatter(grid, rng, detail(size, 6), 'snow', ['sand'])
      const plants = Math.max(3, detail(size, 1.5))
      for (let i = 0; i < plants; i++) {
        const x = rng.int(cx - hw + 3, cx + hw - 3)
        const z = rng.int(cx - hd + 3, cx + hd - 3)
        if (grid.topY(x, z) > 4) continue
        const pick = rng.int(0, 2)
        if (pick === 0) saguaro(grid, rng, x, 4, z, rng.int(5, Math.max(6, Math.round(size * 0.22))), 1)
        else if (pick === 1) barrel(grid, x, 4, z, rng.int(2, 3))
        else {
          // Succulent rosette.
          cylinder(grid, x, z, 4, 4, 1.6, 'leaf')
          grid.set(x, 5, z, 'petal')
        }
      }
      return grid
    }

    // Terracotta pot that tapers out towards a lip, filled with soil, with pebbles around it.
    const potR = size * (0.21 + rng.next() * 0.04)
    const potTop = Math.round(size * 0.18)
    for (let y = 1; y <= potTop; y++) cylinder(grid, c, c, y, y, potR * (0.78 + (0.22 * y) / potTop), 'pot')
    cylinder(grid, c, c, potTop, potTop, potR * 1.08, 'pot')
    cylinder(grid, c, c, potTop, potTop, potR - 1, 'soil')
    const base = potTop + 1
    const w = size >= 45 ? 5 : 3
    if (kind === 'saguaro') saguaro(grid, rng, cx, base, cx, Math.round(size * (0.32 + rng.next() * 0.12)), w)
    else if (kind === 'barrel') barrel(grid, cx, base, cx, Math.max(3, Math.round(potR * 0.75)))
    else pear(grid, rng, cx, base, cx, Math.max(3, Math.round(size * 0.1)), 2)
    scatter(grid, rng, detail(size, rng.int(6, 10)), 'stone', ['wood'])
    // Tiny pebbles on the soil.
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(cx - 4, cx + 4)
      const z = rng.int(cx - 4, cx + 4)
      if (grid.get(x, base, z) === undefined && grid.get(x, potTop, z) === 'soil')
        grid.set(x, base, z, 'stone')
    }
    return grid
  },
}
