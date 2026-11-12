import { type Material, VoxelGrid } from '../voxels'
import { box, decorate, detail, hash3, line } from './shapes'
import type { SceneDef } from './types'

const WALLS: Material[] = ['cloth', 'wood', 'stone', 'sand']

/**
 * A Chongqing hillside: buildings stacked up a steep terraced slope, stilted houses at the cliff edges,
 * glowing windows, a river with a boat at the bottom and a cable car crossing overhead. Long links grow
 * more and taller buildings.
 */
export const chongqing: SceneDef = {
  group: 'city',
  id: 'chongqing',
  creatures: ['bird', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, Math.round(size * 1.15))
    const river = Math.round(size * (0.78 + rng.next() * 0.06))
    const H = Math.round(size * (0.42 + rng.next() * 0.08))
    const ground = (x: number, z: number) =>
      z >= river ? 0 : Math.round((H * (river - z)) / river / 3) * 3 + (hash3(x, 0, z) % 4 === 0 ? 1 : 0)

    // Terraced hill of rock with grass ledges; the river along the front.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const h = ground(x, z)
        if (z >= river) {
          grid.set(x, 0, z, 'water')
          continue
        }
        box(grid, x, 0, z, x, h, z, 'stone')
        grid.set(x, h + 1, z, 'grass')
      }

    // Stack buildings on lots across the slope.
    const lot = Math.max(4, Math.round(size / 9))
    for (let lz = 1; lz < river - 3; lz += lot + 1)
      for (let lx = 1; lx < size - 3; lx += lot + rng.int(0, 2)) {
        if (!rng.chance(0.82)) continue
        const x1 = Math.min(size - 2, lx + lot - 1)
        const z1 = Math.min(river - 2, lz + lot - 1)
        const base = ground(lx, z1) + 2
        const top = base + rng.int(3, 5 + Math.round(detail(size, 2)))
        const wall = rng.pick(WALLS)
        box(grid, lx, base, lz, x1, top, z1, wall)
        // Stilts down to the slope under the front edge (the downhill side).
        for (let x = lx; x <= x1; x += 2) {
          const g = ground(x, z1 + 1) + 2
          if (g < base) box(grid, x, g, z1, x, base - 1, z1, 'wood')
        }
        // Rows of lit windows on the street side.
        for (let y = base + 1; y < top; y += 2)
          for (let x = lx + 1; x < x1; x += 2)
            if (hash3(x, y, z1) < 70) grid.set(x, y, z1, rng.chance(0.6) ? 'fish' : 'glass')
        // Flat roof with a ledge, or a tiled roof with upturned eaves.
        if (rng.chance(0.5)) box(grid, lx - 1, top + 1, lz - 1, x1 + 1, top + 1, z1 + 1, 'roof')
        else {
          box(grid, lx, top + 1, lz, x1, top + 1, z1, 'roof')
          if (rng.chance(0.5)) box(grid, lx + 1, top + 2, lz + 1, lx + 2, top + 3, lz + 2, 'pot')
        }
      }

    // Cable car line across the valley, with a red cabin.
    const ya = H + 6
    line(grid, [0, ya, Math.round(river * 0.3)], [size - 1, ya - 4, Math.round(river * 0.5)], 'roof')
    const mx = Math.round(size / 2)
    const my = ya - 2
    const mz = Math.round(river * 0.4)
    box(grid, mx - 1, my - 3, mz - 1, mx + 1, my - 1, mz + 1, 'accent')
    box(grid, mx - 1, my - 2, mz + 1, mx + 1, my - 2, mz + 1, 'glass')
    // A boat on the river and a red lantern by the water.
    const bx = rng.int(2, size - 8)
    const bz = Math.min(size - 2, river + 2)
    box(grid, bx, 1, bz, bx + 5, 1, bz + 1, 'wood')
    box(grid, bx + 1, 2, bz, bx + 3, 3, bz + 1, 'accent')
    decorate(grid, rng)
    return grid
  },
}
