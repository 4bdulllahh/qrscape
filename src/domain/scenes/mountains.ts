import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, hash3 } from './shapes'
import type { SceneDef } from './types'

/** Seeded peaks with snow caps, rocky slopes, a lake in the lowest spot and a few pines. */
export const mountains: SceneDef = {
  group: 'nature',
  id: 'mountains',
  creatures: ['bird', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    const peaks = Array.from({ length: rng.int(2, 3) }, () => ({
      x: rng.int(size * 0.2, size * 0.8),
      z: rng.int(size * 0.2, size * 0.8),
      r: size * (0.3 + rng.next() * 0.2),
      h: size * (0.45 + rng.next() * 0.25),
    }))
    const heights: number[] = []
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        let h = 1
        for (const p of peaks) {
          const d = Math.hypot(x - p.x, z - p.z) / p.r
          // Pointy peaks: falls off fast near the top, gentle at the base.
          if (d < 1) h = Math.max(h, 1 + p.h * (1 - d) ** 1.3 + (hash3(x, 0, z) % 3) - 1)
        }
        heights.push(Math.round(h))
      }

    const snowLine = Math.max(...heights) * 0.68
    const rockLine = Math.max(...heights) * 0.4
    const lake = {
      x: rng.int(size * 0.15, size * 0.85),
      z: rng.int(size * 0.15, size * 0.85),
      r: size * 0.16,
    }
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const h = heights[z * size + x] ?? 1
        // The lake fills the low ground near its seeded centre; its edge wobbles a little.
        if (h <= 2 && Math.hypot(x - lake.x, z - lake.z) < lake.r + (hash3(x, 1, z) % 3)) {
          grid.set(x, 0, z, 'water')
          continue
        }
        box(grid, x, 0, z, x, h - 1, z, 'soil')
        grid.set(x, h, z, h >= snowLine ? 'snow' : h >= rockLine ? 'stone' : 'grass')
      }

    // Pines on the low grass.
    for (let i = detail(size, rng.int(5, 8)); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      const y = grid.topY(x, z)
      if (grid.get(x, y, z) !== 'grass') continue
      const h = rng.int(3, 5)
      box(grid, x, y + 1, z, x, y + 1, z, 'trunk')
      for (let k = 0; k < h; k++) blob(grid, [x, y + 2 + k, z], Math.max(0.6, (h - k) * 0.55), 'leaf', 0.3, 0)
    }
    // Boulders on the slopes.
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.get(x, grid.topY(x, z), z) === 'stone')
        blob(grid, [x, grid.topY(x, z) + 1, z], rng.int(1, 2), 'stone', 0.7, 20)
    }
    // A boat on the lake and, on bigger QRs, a little red-roofed cabin on a flat patch of grass.
    if (grid.get(Math.round(lake.x), 0, Math.round(lake.z)) === 'water')
      box(
        grid,
        Math.round(lake.x) - 1,
        1,
        Math.round(lake.z),
        Math.round(lake.x) + 1,
        1,
        Math.round(lake.z),
        'wood',
      )
    for (let tries = size >= 33 ? 40 : 0; tries > 0; tries--) {
      const x = rng.int(3, size - 4)
      const z = rng.int(3, size - 4)
      const y = grid.topY(x, z)
      const flat = [-2, 2].every((dx) =>
        [-2, 2].every((dz) => grid.topY(x + dx, z + dz) === y && grid.get(x + dx, y, z + dz) === 'grass'),
      )
      if (!flat || grid.get(x, y, z) !== 'grass') continue
      box(grid, x - 1, y + 1, z - 1, x + 1, y + 2, z + 1, 'wood')
      grid.set(x, y + 1, z + 1, 'trunk')
      box(grid, x - 2, y + 3, z - 2, x + 2, y + 3, z + 2, 'accent')
      box(grid, x - 1, y + 4, z - 1, x + 1, y + 4, z + 1, 'accent')
      break
    }
    decorate(grid, rng)
    return grid
  },
}
