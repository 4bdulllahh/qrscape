import { VoxelGrid } from '../voxels'
import { box, cylinder, detail, scatter, slab } from './shapes'
import type { SceneDef } from './types'

/** A chunky cactus with 2 or 3 seeded arms and a flower, in a terracotta pot on a table with pebbles. */
export const cactus: SceneDef = {
  group: 'nature',
  id: 'cactus',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'wood')
    const c = (size - 1) / 2
    const potR = size * (0.21 + rng.next() * 0.04)
    const potTop = Math.round(size * 0.18)

    // Pot tapers out towards a lip, filled with soil.
    for (let y = 1; y <= potTop; y++) cylinder(grid, c, c, y, y, potR * (0.78 + (0.22 * y) / potTop), 'pot')
    cylinder(grid, c, c, potTop, potTop, potR * 1.08, 'pot')
    cylinder(grid, c, c, potTop, potTop, potR - 1, 'soil')

    // Main stem 3 wide; arms go out then up.
    const h = Math.round(size * (0.32 + rng.next() * 0.12))
    const cx = Math.round(c)
    const base = potTop + 1
    box(grid, cx - 1, base, cx - 1, cx + 1, base + h, cx + 1, 'leaf')
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const
    // 2 or 3 arms, each pointing a different way.
    const start = rng.int(0, 3)
    for (let i = rng.int(2, 3) - 1; i >= 0; i--) {
      const [dx, dz] = dirs[(start + i) % 4] ?? [1, 0]
      const y = base + rng.int(Math.round(h * 0.3), Math.round(h * 0.6))
      const out = rng.int(3, 4)
      for (let k = 2; k <= out; k++)
        box(grid, cx + dx * k, y, cx + dz * k, cx + dx * k, y + 1, cx + dz * k, 'leaf')
      const ax = cx + dx * out
      const az = cx + dz * out
      box(grid, ax, y, az, ax + (dz ? 1 : 0), y + rng.int(3, 6), az + (dx ? 1 : 0), 'leaf')
    }
    // Flower on top.
    box(grid, cx - 1, base + h + 1, cx, cx + 1, base + h + 1, cx, 'petal')
    box(grid, cx, base + h + 1, cx - 1, cx, base + h + 2, cx + 1, 'petal')

    scatter(grid, rng, detail(size, rng.int(6, 10)), 'stone', ['wood'])
    return grid
  },
}
