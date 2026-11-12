import type { Rng } from '../seed'
import type { Material, VoxelGrid } from '../voxels'

export type Vec = [number, number, number]

/** Fills every column from y0 to y1 (inclusive) with one material. Scenes start with this so no column is empty. */
export function slab(grid: VoxelGrid, y0: number, y1: number, material: Material): void {
  box(grid, 0, y0, 0, grid.size - 1, y1, grid.size - 1, material)
}

export function box(
  grid: VoxelGrid,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  material: Material | null,
): void {
  for (let y = Math.round(y0); y <= y1; y++)
    for (let z = Math.round(z0); z <= z1; z++)
      for (let x = Math.round(x0); x <= x1; x++) grid.set(x, y, z, material)
}

/** Upright cylinder. `wall` > 0 makes it hollow with walls that thick. */
export function cylinder(
  grid: VoxelGrid,
  cx: number,
  cz: number,
  y0: number,
  y1: number,
  r: number,
  material: Material | null,
  wall = 0,
): void {
  for (let y = y0; y <= y1; y++)
    for (let z = Math.floor(cz - r); z <= cz + r; z++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x - cx, z - cz)
        if (d <= r && (wall === 0 || d > r - wall)) grid.set(x, y, z, material)
      }
}

/** Cheap stable noise per position, 0 to 99. */
export function hash3(x: number, y: number, z: number): number {
  return (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 100
}

/** A slightly bumpy ellipsoid: leaves, rocks, bushes. `flat` squashes it (bonsai pads). */
export function blob(grid: VoxelGrid, c: Vec, r: number, material: Material, flat = 0.7, rough = 30): void {
  const [cx, cy, cz] = c
  const ry = Math.max(1, r * flat)
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let z = Math.floor(cz - r); z <= cz + r; z++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = ((x - cx) / r) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / r) ** 2
        if (d <= 1 && !(d > 0.75 && hash3(x, y, z) < rough)) grid.set(x, y, z, material)
      }
}

/** A straight 1-voxel line between two points. */
export function line(grid: VoxelGrid, a: Vec, b: Vec, material: Material): void {
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]), 1)
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    grid.set(
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
      material,
    )
  }
}

export interface TreeOptions {
  height: number
  canopy: number
  thick: number
  leaf: Material
  /** Sideways wiggle of the trunk per step: 0 straight, higher twists more (bonsai). */
  twist?: number
  /** Canopy squash: 0.7 round, 0.35 flat pads. */
  flat?: number
  branches?: [number, number]
  /** How far branches reach, as a multiple of the canopy radius (1 = compact, 2+ = wide airy crown). */
  reach?: number
}

/** A seeded tree standing on (x, baseY, z). Shared by tree, bonsai and cherry blossom. */
export function growTree(
  grid: VoxelGrid,
  rng: Rng,
  x: number,
  baseY: number,
  z: number,
  o: TreeOptions,
): void {
  const lean: [number, number] = [rng.int(-1, 1), rng.int(-1, 1)]
  const forks: Vec[] = []
  let tx = x
  let tz = z
  for (let y = baseY; y < baseY + o.height; y++) {
    if (y > baseY + 2 && rng.chance(o.twist ?? 0.18)) {
      tx += o.twist ? rng.int(-1, 1) : lean[0]
      tz += o.twist ? rng.int(-1, 1) : lean[1]
    }
    box(grid, tx, y, tz, tx + o.thick - 1, y, tz + o.thick - 1, 'trunk')
    if (y > baseY + o.height * 0.45) forks.push([tx, y, tz])
  }
  const top: Vec = [tx, baseY + o.height, tz]
  const [minB, maxB] = o.branches ?? [3, 5]
  const count = rng.int(minB, maxB)
  const turn = rng.next() * Math.PI * 2
  const ceiling = grid.height - Math.ceil(o.canopy * (o.flat ?? 0.7)) - 1
  for (let i = 0; i < count; i++) {
    const from = forks[rng.int(0, forks.length - 1)] ?? top
    const angle = turn + (i / count) * Math.PI * 2 + (rng.next() - 0.5) * 0.6
    const reach = o.canopy * (0.8 + rng.next() * 0.6) * (o.reach ?? 1)
    const end: Vec = [
      Math.round(from[0] + Math.cos(angle) * reach),
      Math.min(ceiling, Math.round(from[1] + reach * (0.3 + rng.next() * 0.5))),
      Math.round(from[2] + Math.sin(angle) * reach),
    ]
    line(grid, from, end, 'trunk')
    blob(grid, end, o.canopy * (0.7 + rng.next() * 0.3), o.leaf, o.flat)
  }
  blob(grid, [top[0], Math.min(ceiling, top[1] + 1), top[2]], o.canopy, o.leaf, o.flat)
}

/** Drops `count` single voxels of a material on random grass/sand tops. */
export function scatter(grid: VoxelGrid, rng: Rng, count: number, material: Material, on: Material[]): void {
  for (let i = 0; i < count; i++) {
    const x = rng.int(1, grid.size - 2)
    const z = rng.int(1, grid.size - 2)
    const y = grid.topY(x, z)
    const below = grid.get(x, y, z)
    if (below && on.includes(below)) grid.set(x, y + 1, z, material)
  }
}

/** Smallest QR the site makes: version 1 (21 cells) plus the 2-cell quiet zone on each side. */
const SMALLEST = 25

/** A detail count that grows with the QR's area: `base` on the smallest QR, about 6x on a long link. */
export function detail(size: number, base: number): number {
  return Math.round(base * (size / SMALLEST) ** 2)
}

/** Finishing touches on open ground: grass tufts, flowers and pebbles. Long links get more of them. */
export function decorate(grid: VoxelGrid, rng: Rng, amount = 1): void {
  for (let i = detail(grid.size, 8 * amount); i > 0; i--) {
    const x = rng.int(1, grid.size - 2)
    const z = rng.int(1, grid.size - 2)
    const y = grid.topY(x, z)
    const top = grid.get(x, y, z)
    const roll = rng.next()
    if (top === 'grass')
      grid.set(x, y + 1, z, roll < 0.4 ? 'grass' : roll < 0.65 ? 'petal' : roll < 0.8 ? 'accent' : 'stone')
    else if (top === 'sand' && roll < 0.4) grid.set(x, y + 1, z, 'stone')
  }
}
