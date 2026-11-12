import { VoxelGrid } from '../voxels'
import { blob, box, cylinder, detail, growTree, hash3, lantern, slab } from './shapes'
import type { SceneDef } from './types'

/**
 * A karesansui dry garden: raked sand rippling around moss islands, each with a group of three rocks
 * and round pruned shrubs, plus a stone lantern, a water basin, stepping stones and a small pine.
 */
export const zengarden: SceneDef = {
  group: 'nature',
  id: 'zengarden',
  creatures: ['butterfly', 'dragonfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'sand')
    const islands = Array.from({ length: Math.max(1, detail(size, rng.int(1, 2))) }, () => ({
      x: rng.int(size * 0.25, size * 0.75),
      z: rng.int(size * 0.25, size * 0.75),
      r: rng.int(3, Math.max(3, Math.round(size * 0.1))),
    }))
    const straight = rng.chance(0.5)

    // Rake lines: ripples circle each island, straight or diagonal lines everywhere else.
    for (let z = 1; z < size - 1; z++)
      for (let x = 1; x < size - 1; x++) {
        const near = islands.map((r) => Math.hypot(x - r.x, z - r.z) - r.r).reduce((a, b) => Math.min(a, b))
        if (near < 0) {
          grid.set(x, 1, z, 'grass')
          if (near < -1.5 && hash3(x, 2, z) < 50) grid.set(x, 2, z, 'grass')
          continue
        }
        const ridge = near < 7 ? Math.round(near) % 3 === 0 : (straight ? z : x + z) % 3 === 0
        if (ridge) grid.set(x, 1, z, 'sand')
      }

    // Each island: one tall standing rock, a medium and a low one (the classic group of three), and shrubs.
    for (const is of islands) {
      const a = rng.next() * Math.PI * 2
      const r = Math.max(2, Math.round(is.r * 0.45))
      blob(grid, [is.x, 2 + r, is.z], r, 'stone', 1.6, 20)
      blob(
        grid,
        [Math.round(is.x + Math.cos(a) * r * 1.6), 2, Math.round(is.z + Math.sin(a) * r * 1.6)],
        r * 0.8,
        'stone',
        1,
        20,
      )
      blob(
        grid,
        [Math.round(is.x - Math.cos(a + 0.6) * r * 1.8), 2, Math.round(is.z - Math.sin(a + 0.6) * r * 1.8)],
        r * 0.6,
        'stone',
        0.6,
        20,
      )
      blob(
        grid,
        [Math.round(is.x + Math.cos(a + 2) * is.r * 0.7), 3, Math.round(is.z + Math.sin(a + 2) * is.r * 0.7)],
        Math.max(1.5, r * 0.7),
        rng.chance(0.5) ? 'leaf' : 'petal',
        0.75,
        10,
      )
    }

    // Stepping stones along one side.
    const side = rng.int(0, 1)
    for (let t = 3; t < size - 3; t += 3) {
      const [x, z] = side ? [t, 3] : [3, t]
      box(grid, x, 1, z, x + 1, 1, z + 1, 'stone')
    }

    // Lantern with a water basin in one corner, a small pine in the opposite one.
    const far = size - 5
    const [lx, lz, px, pz] = rng.chance(0.5) ? [far, far, 5, far] : [far, 5, 5, 5]
    lantern(grid, lx, 1, lz)
    cylinder(grid, lx - 3, lz + (lz > size / 2 ? -3 : 3), 1, 2, 1.6, 'stone')
    grid.set(lx - 3, 2, lz + (lz > size / 2 ? -3 : 3), 'water')
    box(grid, px - 2, 1, pz - 2, px + 2, 1, pz + 2, 'grass')
    growTree(grid, rng, px, 2, pz, {
      height: Math.max(4, Math.round(size * 0.14)),
      canopy: Math.max(2, Math.round(size * 0.06)),
      thick: 1,
      leaf: 'leaf',
      twist: 0.4,
      flat: 0.35,
      branches: [2, 3],
    })

    // Low wooden border.
    box(grid, 0, 1, 0, size - 1, 2, 0, 'wood')
    box(grid, 0, 1, size - 1, size - 1, 2, size - 1, 'wood')
    box(grid, 0, 1, 0, 0, 2, size - 1, 'wood')
    box(grid, size - 1, 1, 0, size - 1, 2, size - 1, 'wood')
    return grid
  },
}
