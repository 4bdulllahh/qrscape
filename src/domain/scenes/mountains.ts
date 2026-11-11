import { VoxelGrid } from '../voxels'
import { blob, box, hash3 } from './shapes'
import type { SceneDef } from './types'

/** Seeded peaks with snow caps, rocky slopes, a lake in the lowest spot and a few pines. */
export const mountains: SceneDef = {
  id: 'mountains',
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
    for (let i = rng.int(3, 7); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      const y = grid.topY(x, z)
      if (grid.get(x, y, z) !== 'grass') continue
      const h = rng.int(3, 5)
      box(grid, x, y + 1, z, x, y + 1, z, 'trunk')
      for (let k = 0; k < h; k++) blob(grid, [x, y + 2 + k, z], Math.max(0.6, (h - k) * 0.55), 'leaf', 0.3, 0)
    }
    return grid
  },
}
