import { type Material, VoxelGrid } from '../voxels'
import { box, decorate, detail, slab } from './shapes'
import type { SceneDef } from './types'

const WALLS: Material[] = ['accent', 'sand', 'petal', 'cloth', 'pot', 'fish']

/**
 * A Venice canal: colourful houses rising straight out of the water with shuttered windows and flower
 * boxes, a stone arch bridge, striped mooring poles and a gondola. Long links get more houses and boats.
 */
export const venice: SceneDef = {
  group: 'city',
  id: 'venice',
  creatures: ['bird', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'water')
    const c = Math.round((size - 1) / 2)
    const half = Math.max(4, Math.round(size * 0.18))
    const north = c - half
    const south = c + half

    // Houses along both banks; the near (south) row is lower so the canal stays in view.
    for (const side of [-1, 1]) {
      let x = 0
      while (x < size) {
        const w = rng.int(4, 7)
        const x1 = Math.min(size - 1, x + w - 1)
        const face = side < 0 ? north : south
        // Near-side houses are shallow, with a paved square behind them.
        const back = side < 0 ? 0 : Math.min(size - 1, face + 4)
        const [z0, z1] = [Math.min(face, back), Math.max(face, back)]
        const floors = side < 0 ? rng.int(3, 4) : 2
        const top = floors * 3 + 1
        const wall = rng.pick(WALLS)
        box(grid, x, 1, z0, x1, top, z1, wall)
        box(grid, x, 1, face, x1, 1, face, 'stone')
        // Windows with dark shutters on every floor, a flower box under some.
        for (let f = 1; f < floors; f++)
          for (let wx = x + 1; wx < x1; wx += 2) {
            grid.set(wx, f * 3 + 1, face, 'glass')
            grid.set(wx, f * 3 + 2, face, 'trunk')
            if (rng.chance(0.3)) grid.set(wx, f * 3, face - side, 'leaf')
          }
        box(grid, x, top + 1, z0, x1, top + 1, z1, 'roof')
        if (rng.chance(0.3)) box(grid, x + 1, top + 2, z0 + 1, x + 1, top + 4, z0 + 1, 'stone')
        x = x1 + 1
      }
    }

    box(grid, 0, 0, south + 5, size - 1, 1, size - 1, 'stone')
    for (let x = 2; x < size; x += 4) grid.set(x, 2, size - 2, 'pot')

    // Stone arch bridge across the canal.
    const bx = c + rng.int(-3, 3)
    for (let z = north; z <= south; z++) {
      const t = (z - north) / (south - north)
      const y = 3 + Math.round(2 * Math.sin(t * Math.PI))
      box(grid, bx - 1, y, z, bx + 1, y, z, 'stone')
      grid.set(bx - 1, y + 1, z, 'cloth')
      grid.set(bx + 1, y + 1, z, 'cloth')
    }

    // Striped mooring poles and gondolas with a gondolier.
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.chance(0.5) ? north + 1 : south - 1
      if (Math.abs(x - bx) < 3) continue
      for (let y = 1; y <= 5; y++) grid.set(x, y, z, y % 2 ? 'snow' : 'accent')
    }
    for (let i = Math.max(1, detail(size, 0.6)); i > 0; i--) {
      const gx = rng.int(2, size - 11)
      if (gx + 9 > bx - 2 && gx < bx + 2) continue
      const gz = c + rng.int(-1, 1)
      box(grid, gx + 1, 1, gz, gx + 7, 1, gz, 'roof')
      grid.set(gx, 2, gz, 'roof')
      grid.set(gx + 8, 2, gz, 'roof')
      grid.set(gx + 8, 3, gz, 'snow')
      // Gondolier: striped shirt, straw hat.
      box(grid, gx + 6, 2, gz, gx + 6, 3, gz, 'roof')
      grid.set(gx + 6, 4, gz, 'snow')
      grid.set(gx + 6, 5, gz, 'accent')
      grid.set(gx + 6, 6, gz, 'sand')
    }
    decorate(grid, rng)
    return grid
  },
}
