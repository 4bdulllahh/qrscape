import { VoxelGrid } from '../voxels'
import { box, decorate, detail, hash3, slab } from './shapes'
import { conifer } from './pine'
import type { SceneDef } from './types'

/**
 * Rice terraces stepping down a hillside: flooded paddies with rows of rice, grassy ridges along each step,
 * a thatched farmhouse at the top and a scarecrow. Long links get more, narrower steps.
 */
export const riceterraces: SceneDef = {
  group: 'nature',
  id: 'riceterraces',
  creatures: ['dragonfly', 'bird', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    const levels = Math.max(5, Math.round(size / 5))
    const w = rng.next() * 6
    const v = rng.next() * 6
    const flip = rng.chance(0.5)
    const level = (x: number, z: number) => {
      const [a, b] = flip ? [x, z] : [z, x]
      const f = (a * 0.65 + b * 0.35) / size + 0.07 * Math.sin(b * 0.3 + w) + 0.05 * Math.sin(a * 0.22 + v)
      // High at the back, stepping down towards the default camera corner so the steps face the viewer.
      return Math.max(0, Math.min(levels - 1, levels - 1 - Math.floor(f * levels)))
    }
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const l = level(x, z)
        const h = 1 + l * 2
        box(grid, x, 1, z, x, h - 1, z, 'soil')
        // A ridge where the next step down starts; the rest is a flooded paddy with rows of rice.
        const ridge = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dz]) => level(x + (dx ?? 0), z + (dz ?? 0)) < l)
        if (ridge || l === levels - 1) grid.set(x, h, z, 'grass')
        else {
          grid.set(x, h, z, 'water')
          if ((flip ? z : x) % 3 === 0 && hash3(x, h, z) < 60) grid.set(x, h + 1, z, 'grass')
        }
      }

    // Thatched farmhouse on the top step.
    const hx = flip ? 5 : rng.int(5, size - 6)
    const hz = flip ? rng.int(5, size - 6) : 5
    const base = grid.topY(hx, hz) + 1
    box(grid, hx - 2, base, hz - 2, hx + 2, base + 2, hz + 2, 'wood')
    for (let i = 0; i <= 3; i++)
      box(grid, hx - 3 + i, base + 3 + i, hz - 3, hx + 3 - i, base + 3 + i, hz + 3, 'sand')
    // A scarecrow in a middle paddy, and pines along the top.
    const sx = Math.round(size / 2)
    const sz = Math.round(size / 2)
    const sy = grid.topY(sx, sz) + 1
    box(grid, sx, sy, sz, sx, sy + 3, sz, 'wood')
    box(grid, sx - 2, sy + 2, sz, sx + 2, sy + 2, sz, 'wood')
    box(grid, sx - 1, sy + 3, sz, sx + 1, sy + 3, sz, 'cloth')
    box(grid, sx - 1, sy + 4, sz, sx + 1, sy + 4, sz, 'sand')
    for (let i = detail(size, 1); i > 0; i--) {
      const x = flip ? rng.int(1, 5) : rng.int(2, size - 3)
      const z = flip ? rng.int(2, size - 3) : rng.int(1, 5)
      if (Math.hypot(x - hx, z - hz) < 5) continue
      conifer(grid, rng, x, grid.topY(x, z) + 1, z, rng.int(5, 8), 2, 1)
    }
    decorate(grid, rng)
    return grid
  },
}
