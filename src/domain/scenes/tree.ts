import type { Rng } from '../seed'
import { VoxelGrid } from '../voxels'
import type { SceneDef } from './types'

/** Fills a slightly bumpy ellipsoid of leaves. */
function leafBlob(grid: VoxelGrid, rng: Rng, cx: number, cy: number, cz: number, r: number): void {
  const ry = r * (0.6 + rng.next() * 0.2)
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let z = Math.floor(cz - r); z <= cz + r; z++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = ((x - cx) / r) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / r) ** 2
        // A cheap position hash roughens the surface so blobs don't look like perfect balls.
        const bump = (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 100
        if (d <= 1 && !(d > 0.75 && bump < 30)) grid.set(x, y, z, 'leaf')
      }
}

/** Draws a 1-voxel-thick line of trunk between two points. */
function limb(grid: VoxelGrid, a: [number, number, number], b: [number, number, number]): void {
  const steps = Math.max(...a.map((v, i) => Math.abs((b[i] ?? 0) - v)), 1)
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    grid.set(
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
      'trunk',
    )
  }
}

/** A grassy island with one seeded tree: lean, branch count, canopy size and stones all come from the seed. */
export const tree: SceneDef = {
  id: 'tree',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    const mid = (size - 1) / 2

    // Ground: soil with a grass top, rising into a soft mound under the tree.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - mid, z - mid) / (size / 2)
        const h = 1 + (d < 0.55 ? Math.round(2 * (1 - d / 0.55)) : 0)
        for (let y = 0; y < h; y++) grid.set(x, y, z, 'soil')
        grid.set(x, h, z, 'grass')
      }

    const base = 4
    const trunkHeight = Math.round(size * (0.32 + rng.next() * 0.12))
    const thick = size >= 33 ? 2 : 1
    let x = Math.round(mid)
    let z = Math.round(mid)
    const lean: [number, number] = [rng.int(-1, 1), rng.int(-1, 1)]
    const forks: [number, number, number][] = []
    for (let y = base - 1; y < base + trunkHeight; y++) {
      if (y > base + 2 && rng.chance(0.18)) {
        x += lean[0]
        z += lean[1]
      }
      for (let dz = 0; dz < thick; dz++)
        for (let dx = 0; dx < thick; dx++) grid.set(x + dx, y, z + dz, 'trunk')
      if (y > base + trunkHeight * 0.45) forks.push([x, y, z])
    }

    const top: [number, number, number] = [x, base + trunkHeight, z]
    const canopy = Math.max(3, Math.round(size * (0.13 + rng.next() * 0.05)))
    const branches = rng.int(3, 5)
    const turn = rng.next() * Math.PI * 2
    for (let i = 0; i < branches; i++) {
      const from = forks[rng.int(0, forks.length - 1)] ?? top
      const angle = turn + (i / branches) * Math.PI * 2 + (rng.next() - 0.5) * 0.6
      const reach = canopy * (0.8 + rng.next() * 0.6)
      const end: [number, number, number] = [
        Math.round(from[0] + Math.cos(angle) * reach),
        Math.min(size - canopy, Math.round(from[1] + reach * (0.4 + rng.next() * 0.5))),
        Math.round(from[2] + Math.sin(angle) * reach),
      ]
      limb(grid, from, end)
      leafBlob(grid, rng, end[0], end[1], end[2], canopy * (0.7 + rng.next() * 0.3))
    }
    leafBlob(grid, rng, top[0], Math.min(size - canopy, top[1] + 1), top[2], canopy)

    // A few stones scattered on the grass.
    for (let i = rng.int(2, 5); i > 0; i--) {
      const sx = rng.int(1, size - 2)
      const sz = rng.int(1, size - 2)
      const sy = grid.topY(sx, sz) + 1
      if (grid.get(sx, sy - 1, sz) === 'grass') grid.set(sx, sy, sz, 'stone')
    }
    return grid
  },
}
