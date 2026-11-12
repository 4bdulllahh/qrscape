import { VoxelGrid } from '../voxels'
import { box, cylinder, decorate, slab } from './shapes'
import type { SceneDef } from './types'

/** An old wooden tofu shop: gable roof, noren, lattice window, sign, lantern, vending machine, bicycle, plants, a cat and tofu crates. */
export const tofushop: SceneDef = {
  group: 'city',
  id: 'tofushop',
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'stone')
    const c = Math.round((size - 1) / 2)
    const hw = Math.round(size * (0.26 + rng.next() * 0.06))
    const x0 = c - hw
    const x1 = c + hw
    const z0 = 2
    const z1 = Math.round(size * (0.45 + rng.next() * 0.05))
    const top = Math.round(size * (0.22 + rng.next() * 0.06))

    box(grid, x0, 1, z0, x1, top, z1, 'wood')
    box(grid, x0 + 1, 1, z0 + 1, x1 - 1, top, z1 - 1, null)
    // Gable roof: steps up from front and back to a ridge, overhanging the sides.
    const mid = Math.round((z0 + z1) / 2)
    for (let i = 0; z0 - 2 + i <= mid; i++) {
      box(grid, x0 - 2, top + 1 + i, z0 - 2 + i, x1 + 2, top + 1 + i, z0 - 2 + i, 'roof')
      box(grid, x0 - 2, top + 1 + i, z1 + 2 - i, x1 + 2, top + 1 + i, z1 + 2 - i, 'roof')
    }

    // Doorway with a noren curtain in strips, and a lantern beside it.
    const door = c + rng.int(-2, 2)
    box(grid, door - 2, 1, z1, door + 2, top - 1, z1, null)
    for (let x = door - 2; x <= door + 2; x++)
      if (x !== door) box(grid, x, top - 3, z1 + 1, x, top - 1, z1 + 1, 'cloth')
    const lx = door + (rng.chance(0.5) ? 4 : -4)
    box(grid, lx, top - 4, z1 + 1, lx, top - 2, z1 + 1, 'accent')
    box(grid, x0 + 2, top - 1, z1 + 1, x0 + 5, top - 1, z1 + 1, 'cloth')

    // Bench with crates of white tofu blocks, and a wooden tub of water.
    const bz = z1 + 4
    box(grid, x0 + 1, 1, bz, x0 + 1, 1, bz + 1, 'wood')
    box(grid, x0 + 7, 1, bz, x0 + 7, 1, bz + 1, 'wood')
    box(grid, x0 + 1, 2, bz, x0 + 7, 2, bz + 1, 'wood')
    for (let x = x0 + 2; x <= x0 + 6; x += 2) {
      box(grid, x, 3, bz, x + 1, 3, bz + 1, 'wood')
      grid.set(x, 4, bz, 'snow')
      if (rng.chance(0.7)) grid.set(x + 1, 4, bz + 1, 'snow')
    }
    // Lattice window, a shop sign over the door and a ridge line on the roof.
    const wx = door + (lx > door ? -7 : 5)
    box(grid, wx, 3, z1, wx + 2, top - 3, z1, 'glass')
    for (let y = 3; y <= top - 3; y += 2) box(grid, wx, y, z1, wx + 2, y, z1, 'wood')
    box(grid, door - 2, top + 1, z1 + 3, door + 2, top + 2, z1 + 3, 'wood')
    for (let x = door - 1; x <= door + 1; x += 2) grid.set(x, top + 2, z1 + 4, 'snow')
    box(grid, x0 - 2, top + 2 + mid - z0, mid, x1 + 2, top + 2 + mid - z0, mid, 'stone')

    // Street life: a drinks vending machine, a parked bicycle, potted plants and a cat on the step.
    const vx = lx > door ? x1 + 2 : x0 - 3
    box(grid, vx, 1, z1 - 1, vx + 1, Math.min(top, 6), z1, 'accent')
    box(grid, vx, 3, z1 + 1, vx + 1, Math.min(top, 6) - 1, z1 + 1, 'glass')
    const bikeX = rng.int(x0 + 2, x1 - 6)
    const bikeZ = Math.min(size - 3, bz + 4)
    for (const x of [bikeX, bikeX + 4])
      for (let y = 1; y <= 3; y++)
        for (let k = -1; k <= 1; k++) if (Math.hypot(y - 2, k) > 0.7) grid.set(x + k, y, bikeZ, 'roof')
    box(grid, bikeX, 3, bikeZ, bikeX + 4, 3, bikeZ, 'accent')
    box(grid, bikeX + 4, 4, bikeZ, bikeX + 4, 4, bikeZ, 'roof')
    for (let i = Math.max(2, Math.round(size / 15)); i > 0; i--) {
      const px = rng.int(x0, x1)
      if (grid.topY(px, z1 + 2) > 0) continue
      box(grid, px, 1, z1 + 2, px, 1, z1 + 2, 'pot')
      grid.set(px, 2, z1 + 2, 'leaf')
    }
    box(grid, door + 1, 1, z1 + 1, door + 2, 1, z1 + 1, 'snow')
    grid.set(door + 2, 2, z1 + 1, 'snow')

    const tx = x1 - 3
    const tz = bz + rng.int(1, 3)
    cylinder(grid, tx, tz, 1, 3, 2.4, 'wood')
    cylinder(grid, tx, tz, 3, 3, 1.5, 'water')
    decorate(grid, rng)
    return grid
  },
}
