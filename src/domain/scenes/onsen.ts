import { VoxelGrid } from '../voxels'
import { blob, box, cylinder, detail, hash3, lantern, slab } from './shapes'
import type { SceneDef } from './types'

/**
 * A snowy mountain hot spring: steaming rock pools, a snow monkey soaking, a little roofed pavilion,
 * a bamboo screen, wooden buckets and a lantern.
 */
export const onsen: SceneDef = {
  group: 'nature',
  id: 'onsen',
  creatures: ['steam', 'bird'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'stone')
    slab(grid, 1, 1, 'snow')
    const c = (size - 1) / 2
    // One big pool, plus a small one on long links.
    const pools = [{ x: c + rng.int(-2, 2), z: c + rng.int(-1, 3), r: size * (0.24 + rng.next() * 0.04) }]
    if (size >= 37) pools.push({ x: c + size * 0.28, z: c - size * 0.25, r: size * 0.1 })
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const d = Math.min(...pools.map((p) => Math.hypot(x - p.x, z - p.z) / p.r))
        const wobble = (hash3(x, 0, z) % 10) / 60
        if (d < 1 - wobble) grid.set(x, 1, z, 'water')
        else if (d < 1.25) {
          // Rocky rim, snow capping some rocks.
          const tall = hash3(x, 2, z) < 50
          box(grid, x, 1, z, x, tall ? 2 : 1, z, 'stone')
          if (tall && hash3(x, 3, z) < 40) grid.set(x, 3, z, 'snow')
        }
      }
    const main = pools[0] ?? { x: c, z: c, r: 5 }

    // Snow monkey soaking at the edge: brown fur, red face, ears.
    const mx = Math.round(main.x + main.r * 0.45)
    const mz = Math.round(main.z)
    box(grid, mx - 1, 1, mz - 1, mx + 1, 2, mz + 1, 'soil')
    box(grid, mx - 1, 3, mz - 1, mx + 1, 4, mz, 'soil')
    box(grid, mx - 1, 3, mz - 2, mx + 1, 3, mz - 2, 'accent')
    grid.set(mx, 4, mz - 2, 'accent')
    grid.set(mx - 2, 4, mz, 'soil')
    grid.set(mx + 2, 4, mz, 'soil')
    grid.set(mx, 5, mz, 'snow')

    // Pavilion over the back of the pool: four posts and a stepped roof.
    const vx = Math.round(main.x - main.r * 0.6)
    const vz = Math.round(main.z - main.r * 0.6)
    const ph = Math.max(6, Math.round(size * 0.2))
    for (const [dx, dz] of [
      [-3, -3],
      [3, -3],
      [-3, 3],
      [3, 3],
    ] as const)
      box(grid, vx + dx, 1, vz + dz, vx + dx, ph, vz + dz, 'wood')
    for (let i = 0; i <= 3; i++)
      box(grid, vx - 5 + i, ph + 1 + i, vz - 5 + i, vx + 5 - i, ph + 1 + i, vz + 5 - i, 'roof')
    for (let i = 0; i <= 1; i++)
      box(grid, vx - 5 + i, ph + 2 + i, vz - 5 + i, vx + 5 - i, ph + 2 + i, vz + 5 - i, 'snow')
    box(grid, vx - 1, ph + 5, vz - 1, vx + 1, ph + 5, vz + 1, 'roof')

    // Bamboo screen along the back edge, buckets by the pool, a lantern, snowy shrubs.
    for (let x = 0; x < size; x++) box(grid, x, 2, 0, x, x % 2 ? 6 : 7, 0, 'leaf')
    const bx = Math.round(main.x - main.r - 3)
    for (let i = 0; i < 3; i++)
      cylinder(grid, bx, Math.round(main.z) + i * 3, 2, 3 - (i === 1 ? 0 : 1), 1, 'wood')
    lantern(grid, Math.round(main.x + main.r + 3), 2, Math.round(main.z + main.r * 0.4))
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(2, size - 3)
      const z = rng.int(2, size - 3)
      if (grid.topY(x, z) !== 1 || grid.get(x, 1, z) !== 'snow') continue
      blob(grid, [x, 2, z], rng.int(1, 2), 'leaf', 0.8, 20)
      grid.set(x, grid.topY(x, z) + 1, z, 'snow')
    }
    return grid
  },
}
