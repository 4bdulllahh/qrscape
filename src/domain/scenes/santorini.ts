import { VoxelGrid } from '../voxels'
import { blob, box, cylinder, decorate, detail, hash3 } from './shapes'
import type { SceneDef } from './types'

/**
 * Santorini: white cube houses with blue domes cascading down a cliff to the sea, a church bell tower,
 * pink bougainvillea, and a sailboat in the bay. Long links grow more houses.
 */
export const santorini: SceneDef = {
  group: 'city',
  id: 'santorini',
  creatures: ['bird', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, Math.round(size * 1.05))
    const sea = Math.round(size * (0.72 + rng.next() * 0.06))
    const H = Math.round(size * (0.36 + rng.next() * 0.06))
    const ground = (x: number, z: number) =>
      z >= sea ? 0 : Math.round((H * (sea - z)) / sea / 2) * 2 + (hash3(x, 0, z) % 5 === 0 ? 1 : 0)

    // Cliff of warm rock; the top layer is pale paving.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        if (z >= sea) {
          grid.set(x, 0, z, 'water')
          continue
        }
        const h = ground(x, z)
        box(grid, x, 0, z, x, h, z, 'soil')
        grid.set(x, h + 1, z, 'sand')
      }

    // White houses on the slope: flat roofs, blue doors, some blue domes.
    const lot = Math.max(3, Math.round(size / 11))
    for (let lz = 1; lz < sea - 2; lz += lot + 1)
      for (let lx = 1; lx < size - 2; lx += lot + rng.int(1, 2)) {
        if (!rng.chance(0.75)) continue
        const x1 = Math.min(size - 2, lx + lot - 1)
        const z1 = Math.min(sea - 2, lz + lot - 1)
        const base = ground(lx, z1) + 2
        const top = base + rng.int(2, 3)
        box(grid, lx, base, lz, x1, top, z1, 'snow')
        // Fill under the house down to the slope, so nothing floats.
        for (let x = lx; x <= x1; x++) box(grid, x, ground(x, z1 + 1) + 2, z1, x, base - 1, z1, 'snow')
        grid.set(Math.round((lx + x1) / 2), base, z1, 'glass')
        grid.set(Math.round((lx + x1) / 2), base + 1, z1, 'glass')
        if (rng.chance(0.3)) {
          const r = (x1 - lx) / 2
          const cx = (lx + x1) / 2
          const cz = (lz + z1) / 2
          for (let k = 0; k <= Math.ceil(r); k++)
            cylinder(grid, cx, cz, top + 1 + k, top + 1 + k, Math.max(0.6, r - k * 0.9), 'glass')
        }
        if (rng.chance(0.25)) blob(grid, [x1, base + 1, z1 + 1], 1.2, 'petal', 1, 25)
      }

    // Bell tower near the top with a blue dome.
    const tx = rng.int(4, size - 5)
    const tz = 3
    const tb = ground(tx, tz) + 2
    box(grid, tx - 1, tb, tz - 1, tx + 1, tb + 7, tz + 1, 'snow')
    grid.set(tx, tb + 5, tz + 1, 'roof')
    cylinder(grid, tx, tz, tb + 8, tb + 8, 1.6, 'glass')
    grid.set(tx, tb + 9, tz, 'glass')
    grid.set(tx, tb + 10, tz, 'snow')

    // Sailboats in the bay.
    for (let i = Math.max(1, detail(size, 0.6)); i > 0; i--) {
      const bx = rng.int(2, size - 8)
      const bz = rng.int(sea + 2, size - 3)
      box(grid, bx, 1, bz, bx + 5, 1, bz + 1, 'wood')
      box(grid, bx + 2, 2, bz, bx + 2, 7, bz, 'trunk')
      for (let y = 3; y <= 7; y++) box(grid, bx + 3, y, bz, bx + 3 + Math.round((7 - y) / 2), y, bz, 'cloth')
    }
    decorate(grid, rng)
    return grid
  },
}
