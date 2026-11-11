import { VoxelGrid } from '../voxels'
import type { SceneDef } from './types'

/** M3 test scene: a grassy island with soft seeded hills and a pond. Replaced by real scenes from M4. */
export const meadow: SceneDef = {
  id: 'meadow',
  build(size, rng) {
    const grid = new VoxelGrid(size, Math.ceil(size / 2))
    const hills = Array.from({ length: rng.int(2, 4) }, () => ({
      x: rng.int(0, size - 1),
      z: rng.int(0, size - 1),
      r: rng.int(Math.floor(size / 6), Math.floor(size / 3)),
      h: rng.int(2, Math.max(3, Math.floor(size / 6))),
    }))
    const pond = {
      x: rng.int(size / 4, (size * 3) / 4),
      z: rng.int(size / 4, (size * 3) / 4),
      r: rng.int(2, 4),
    }

    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        let h = 1
        for (const hill of hills) {
          const d = Math.hypot(x - hill.x, z - hill.z) / hill.r
          if (d < 1) h += Math.round(hill.h * (1 - d * d))
        }
        const inPond = Math.hypot(x - pond.x, z - pond.z) < pond.r
        if (inPond) {
          grid.set(x, 0, z, 'water')
          continue
        }
        for (let y = 0; y < h; y++) grid.set(x, y, z, 'soil')
        grid.set(x, h, z, 'grass')
      }
    return grid
  },
}
