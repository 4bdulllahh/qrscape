import { VoxelGrid } from '../voxels'
import { box, decorate, detail, hash3 } from './shapes'
import { conifer } from './pine'
import type { SceneDef } from './types'

/**
 * Mount Fuji: one wide symmetric cone with a flat crater and a streaky snow cap, forest at its foot,
 * a lake in front, a little red pagoda on the shore and cherry trees.
 */
export const fuji: SceneDef = {
  group: 'nature',
  id: 'fuji',
  creatures: ['bird', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    const cx = size * (0.36 + rng.next() * 0.05)
    const cz = size * (0.36 + rng.next() * 0.05)
    const R = size * 0.62
    const H = size * (0.62 + rng.next() * 0.06)
    const crater = H * 0.9
    const snowLine = H * 0.58
    const lake = { x: size * 0.8, z: size * 0.8, r: size * (0.17 + rng.next() * 0.04) }

    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x - cx, z - cz) / R
        let h = d < 1 ? H * (1 - d) ** 1.35 : 0
        if (h > crater) h = crater - (h > crater + 1.5 ? 1 : 0)
        const top = Math.max(1, Math.round(h) + 1)
        if (top <= 2 && Math.hypot(x - lake.x, z - lake.z) < lake.r + (hash3(x, 0, z) % 3)) {
          grid.set(x, 0, z, 'water')
          continue
        }
        box(grid, x, 0, z, x, top - 1, z, 'soil')
        // Snow reaches further down in streaks, like the gullies on the real mountain.
        const streak = (hash3(Math.round(Math.atan2(z - cz, x - cx) * 12), 0, 0) % 4) * H * 0.06
        grid.set(x, top, z, top >= snowLine - streak ? 'snow' : top >= H * 0.3 ? 'stone' : 'grass')
      }

    // Forest at the foot of the mountain.
    for (let i = detail(size, 6); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      const y = grid.topY(x, z)
      if (grid.get(x, y, z) !== 'grass' || y > H * 0.25) continue
      conifer(grid, rng, x, y + 1, z, rng.int(3, 5), 1.5, 1)
    }
    // Five-storey red pagoda and cherry trees on the lake shore.
    // Off to the side, so it never hides the mountain.
    const px = size - 5
    const pz = 5
    const py = grid.topY(px, pz) + 1
    for (let s = 0; s < 4; s++) {
      const y = py + s * 3
      const w = 2 - Math.floor(s / 2)
      box(grid, px - w, y, pz - w, px + w, y + 1, pz + w, 'accent')
      box(grid, px - w - 1, y + 2, pz - w - 1, px + w + 1, y + 2, pz + w + 1, 'roof')
    }
    box(grid, px, py + 12, pz, px, py + 14, pz, 'roof')
    for (let i = Math.max(2, detail(size, 1)); i > 0; i--) {
      const x = Math.round(lake.x + rng.int(-Math.round(lake.r), 0) - 2)
      const z = Math.round(lake.z - lake.r - 2 + rng.int(-1, 1))
      const y = grid.topY(x, z) + 1
      box(grid, x, y, z, x, y + 2, z, 'trunk')
      for (let dz = -2; dz <= 2; dz++)
        for (let dx = -2; dx <= 2; dx++)
          if (Math.abs(dx) + Math.abs(dz) < 4)
            box(
              grid,
              x + dx,
              y + 3,
              z + dz,
              x + dx,
              y + 3 + (Math.abs(dx) + Math.abs(dz) < 2 ? 1 : 0),
              z + dz,
              'petal',
            )
    }
    decorate(grid, rng)
    return grid
  },
}
