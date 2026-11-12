import { VoxelGrid } from '../voxels'
import { blob, box, cylinder, decorate, detail, hash3, line, slab } from './shapes'
import type { SceneDef } from './types'

/**
 * A still lily pond: pads of every size, pink lotus flowers, frogs sitting on pads, reeds,
 * and a zigzag plank bridge (yatsuhashi) across the water.
 */
export const lilypond: SceneDef = {
  group: 'nature',
  id: 'lilypond',
  creatures: ['dragonfly', 'fish', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const c = (size - 1) / 2
    const R = size * (0.4 + rng.next() * 0.04)
    const w = rng.next() * 6
    const inside = (x: number, z: number) => {
      const a = Math.atan2(z - c, x - c)
      return Math.hypot(x - c, z - c) < R * (1 + 0.1 * Math.sin(a * 3 + w) + 0.05 * Math.sin(a * 7 + w))
    }
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        if (inside(x, z)) grid.set(x, 1, z, 'water')
        else if (inside(x + 1, z) || inside(x - 1, z) || inside(x, z + 1) || inside(x, z - 1))
          grid.set(x, 2, z, hash3(x, 2, z) < 50 ? 'stone' : 'grass')
      }

    // Zigzag bridge: plank runs that turn at right angles, crossing from one side to the other.
    const along = rng.chance(0.5)
    let t = 0
    let off = Math.round(c) + rng.int(-3, 3)
    const run = Math.max(4, Math.round(size / 6))
    while (t < size) {
      for (let k = 0; k < run && t < size; k++, t++) {
        const [x, z] = along ? [t, off] : [off, t]
        box(grid, x, 2, z, along ? x : x + 1, 2, along ? z + 1 : z, 'wood')
      }
      off += rng.chance(0.5) ? 2 : -2
      off = Math.max(3, Math.min(size - 4, off))
    }

    // Pads of every size, some flowering, some with a frog.
    for (let i = detail(size, 7); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.get(x, 1, z) !== 'water' || grid.topY(x, z) !== 1) continue
      const r = rng.chance(0.3) ? 2 : rng.chance(0.5) ? 1.4 : 0.8
      cylinder(grid, x, z, 1, 1, r, 'leaf')
      // A notch cut out of each pad.
      grid.set(x + 1, 1, z, 'water')
      const roll = rng.next()
      if (roll < 0.3) {
        blob(grid, [x, 2, z], 1, 'petal', 1, 0)
        grid.set(x, 3, z, 'accent')
      } else if (roll < 0.4) {
        box(grid, x, 2, z, x, 2, z + 1, 'grass')
        grid.set(x, 3, z, 'grass')
      }
    }
    // Reeds around the edge.
    for (let i = detail(size, 4); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.get(x, 2, z) !== 'grass' && grid.get(x, 2, z) !== 'stone') continue
      const h = rng.int(2, 4)
      line(grid, [x, 3, z], [x, 2 + h, z], 'leaf')
      if (rng.chance(0.4)) grid.set(x, 3 + h, z, 'trunk')
    }
    decorate(grid, rng)
    return grid
  },
}
