import type { Rng } from '../seed'
import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, slab, type Vec } from './shapes'
import type { SceneDef } from './types'

/** One fern frond: a midrib that rises then arches down, with leaflets that shorten towards the tip. */
function frond(grid: VoxelGrid, from: Vec, angle: number, length: number, width: number, rise: number): void {
  const steps = Math.round(length)
  const ux = Math.cos(angle)
  const uz = Math.sin(angle)
  for (let s = 1; s <= steps; s++) {
    const t = s / steps
    const x = from[0] + ux * s
    const z = from[2] + uz * s
    const y = Math.round(from[1] + rise * t - rise * 2.2 * t * t)
    grid.set(Math.round(x), y, Math.round(z), 'leaf')
    const w = Math.round(width * (1 - t) + 0.4)
    for (let k = 1; k <= w; k++)
      for (const side of [-1, 1])
        grid.set(Math.round(x - uz * k * side), y - (k > 1 ? 1 : 0), Math.round(z + ux * k * side), 'leaf')
  }
}

/** A curled young fern frond (fiddlehead). */
function fiddlehead(grid: VoxelGrid, x: number, y: number, z: number): void {
  box(grid, x, y, z, x, y + 2, z, 'leaf')
  box(grid, x, y + 3, z, x + 1, y + 3, z, 'leaf')
  grid.set(x + 1, y + 2, z, 'leaf')
}

function groundFern(grid: VoxelGrid, rng: Rng, x: number, y: number, z: number, size: number): void {
  const n = rng.int(5, 7)
  for (let i = 0; i < n; i++) frond(grid, [x, y, z], (i / n) * Math.PI * 2 + rng.next(), size, 1, size * 0.5)
}

/** A giant tree fern in a misty forest clearing, with ground ferns, fiddleheads, mossy rocks and mushrooms. */
export const fern: SceneDef = {
  group: 'nature',
  id: 'fern',
  creatures: ['butterfly', 'bird'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'grass')
    const c = Math.round((size - 1) / 2)
    const tx = c + rng.int(-2, 2)
    const tz = c + rng.int(-2, 2)
    const h = Math.round(size * (0.38 + rng.next() * 0.08))
    const thick = size >= 37 ? 2 : 1
    // Shaggy trunk: a few stubs of old fronds stick out.
    box(grid, tx, 2, tz, tx + thick - 1, 2 + h, tz + thick - 1, 'trunk')
    for (let y = 4; y < 2 + h; y += 3) grid.set(tx + (y % 2 ? -1 : thick), y, tz, 'trunk')
    const top: Vec = [tx, 2 + h, tz]
    const fronds = rng.int(8, 10)
    const len = Math.max(6, size * 0.28)
    for (let i = 0; i < fronds; i++)
      frond(
        grid,
        top,
        (i / fronds) * Math.PI * 2 + rng.next() * 0.3,
        len * (0.85 + rng.next() * 0.3),
        Math.max(2, len * 0.22),
        len * 0.45,
      )
    fiddlehead(grid, tx, 3 + h, tz)

    // Forest floor: ground ferns, fiddleheads, mossy rocks and mushrooms. More of all on long links.
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(3, size - 4)
      const z = rng.int(3, size - 4)
      if (grid.topY(x, z) !== 1) continue
      if (rng.chance(0.7)) groundFern(grid, rng, x, 2, z, rng.int(3, 4))
      else fiddlehead(grid, x, 2, z)
    }
    for (let i = detail(size, 1.5); i > 0; i--) {
      const x = rng.int(2, size - 3)
      const z = rng.int(2, size - 3)
      if (grid.topY(x, z) !== 1) continue
      blob(grid, [x, 2, z], rng.int(1, 2), 'stone', 0.7, 20)
      grid.set(x, grid.topY(x, z) + 1, z, 'grass')
    }
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.topY(x, z) !== 1) continue
      grid.set(x, 2, z, 'snow')
      grid.set(x, 3, z, rng.chance(0.5) ? 'accent' : 'fish')
    }
    decorate(grid, rng)
    return grid
  },
}
