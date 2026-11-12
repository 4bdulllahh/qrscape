import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, hash3, slab } from './shapes'
import type { SceneDef } from './types'

/** A sunken pond with a stone edge, lily pads, koi and a small wooden bridge. */
export const koipond: SceneDef = {
  group: 'nature',
  id: 'koipond',
  creatures: ['dragonfly', 'butterfly', 'bird'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 1, 'soil')
    slab(grid, 2, 2, 'grass')
    const c = (size - 1) / 2
    const R = size * (0.3 + rng.next() * 0.08)
    const wobble = rng.next() * Math.PI * 2

    const inside = (x: number, z: number) => {
      const a = Math.atan2(z - c, x - c)
      return Math.hypot(x - c, z - c) < R * (1 + 0.15 * Math.sin(a * 3 + wobble))
    }
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        if (inside(x, z)) box(grid, x, 1, z, x, 2, z, null)
        if (inside(x, z)) grid.set(x, 1, z, 'water')
        else if (inside(x + 1, z) || inside(x - 1, z) || inside(x, z + 1) || inside(x, z - 1))
          grid.set(x, 2 + (hash3(x, 2, z) < 40 ? 1 : 0), z, 'stone')
      }

    // Lily pads and koi float on the surface.
    for (let i = detail(size, rng.int(3, 5)); i > 0; i--) {
      const x = Math.round(c + (rng.next() - 0.5) * R * 1.4)
      const z = Math.round(c + (rng.next() - 0.5) * R * 1.4)
      if (grid.get(x, 1, z) === 'water') blob(grid, [x, 1, z], rng.int(1, 2), 'leaf', 0.1, 0)
    }
    for (let i = detail(size, rng.int(2, 4)); i > 0; i--) {
      const x = Math.round(c + (rng.next() - 0.5) * R * 1.2)
      const z = Math.round(c + (rng.next() - 0.5) * R * 1.2)
      const dx = rng.chance(0.5) ? 1 : 0
      for (let k = 0; k < 3; k++)
        if (grid.get(x + k * dx, 1, z + k * (1 - dx)) === 'water')
          grid.set(x + k * dx, 1, z + k * (1 - dx), 'fish')
    }

    // Bridge straight across the middle, gently arched, with low rails.
    const along = rng.chance(0.5)
    for (let t = 0; t < size; t++) {
      const arch = Math.round(2 * Math.sin((t / (size - 1)) * Math.PI))
      const y = 3 + arch
      for (let w = -1; w <= 1; w++) {
        const [x, z] = along ? [t, Math.round(c) + w] : [Math.round(c) + w, t]
        if (grid.topY(x, z) > 2 && arch === 0) continue
        grid.set(x, y, z, 'wood')
        if (Math.abs(w) === 1 && t % 3 === 0) grid.set(x, y + 1, z, 'wood')
      }
    }
    decorate(grid, rng)
    return grid
  },
}
