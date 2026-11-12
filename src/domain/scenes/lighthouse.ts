import { VoxelGrid } from '../voxels'
import { blob, box, cylinder, decorate, detail, hash3, line, slab } from './shapes'
import type { SceneDef } from './types'

/** A small rocky island in the sea with a striped lighthouse and a keeper's cottage. */
export const lighthouse: SceneDef = {
  group: 'nature',
  id: 'lighthouse',
  creatures: ['bird', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'water')
    const c = (size - 1) / 2
    const R = size * (0.3 + rng.next() * 0.06)
    const wobble = rng.next() * Math.PI * 2

    // Island: rocky cliffs, a sandy rim at the waterline, grass on top.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const a = Math.atan2(z - c, x - c)
        const edge = R * (1 + 0.18 * Math.sin(a * 3 + wobble))
        const d = Math.hypot(x - c, z - c)
        if (d > edge) continue
        if (d > edge - 1.5) {
          grid.set(x, 0, z, 'sand')
          continue
        }
        box(grid, x, 0, z, x, 2, z, 'stone')
        grid.set(x, 3, z, hash3(x, 3, z) < 12 ? 'stone' : 'grass')
      }

    // Lighthouse: striped tower, glass lamp room, dark cap.
    const lx = Math.round(c + rng.int(-2, 2))
    const lz = Math.round(c + rng.int(-2, 2))
    // Width grows with the island so big QRs get a sturdy tower, not a pole.
    const r = Math.max(2, size * 0.07)
    const h = Math.round(6 + size * (0.3 + rng.next() * 0.08))
    const band = rng.int(2, 3)
    for (let y = 4; y < 4 + h; y++)
      cylinder(grid, lx, lz, y, y, r, Math.floor((y - 4) / band) % 2 === 0 ? 'snow' : 'accent')
    // Gallery with a railing, lamp room, domed cap.
    const lamp = Math.max(2, Math.round(r * 0.8))
    cylinder(grid, lx, lz, 4 + h, 4 + h, r + 1.5, 'roof')
    cylinder(grid, lx, lz, 5 + h, 5 + h, r + 1.5, 'roof', 1)
    cylinder(grid, lx, lz, 5 + h, 4 + h + lamp, r - 0.5, 'glass')
    cylinder(grid, lx, lz, 5 + h + lamp, 5 + h + lamp, r, 'roof')
    cylinder(grid, lx, lz, 6 + h + lamp, 6 + h + lamp, r * 0.6, 'roof')
    grid.set(lx, 7 + h + lamp, lz, 'roof')
    // A door at the foot.
    box(grid, Math.round(lx + r), 4, lz, Math.round(lx + r), 6, lz, 'wood')

    // Keeper's cottage with a pitched roof, and a shrub.
    const hx = Math.round(c + (rng.chance(0.5) ? -1 : 1) * R * 0.45)
    const hz = Math.round(c + R * 0.35)
    box(grid, hx - 2, 4, hz - 2, hx + 2, 6, hz + 2, 'wood')
    for (let i = 0; i <= 3; i++) box(grid, hx - 3 + i, 7 + i, hz - 3, hx + 3 - i, 7 + i, hz + 3, 'roof')
    blob(grid, [Math.round(c - R * 0.4), 5, Math.round(c - R * 0.3)], 2, 'leaf')

    // More island life on bigger QRs: shrubs, a stone path, rocks in the sea and a wooden pier with a boat.
    for (let i = detail(size, 1.5); i > 0; i--) {
      const x = rng.int(2, size - 3)
      const z = rng.int(2, size - 3)
      if (grid.get(x, grid.topY(x, z), z) === 'grass') blob(grid, [x, 4, z], rng.int(1, 2), 'leaf', 0.8, 30)
    }
    line(grid, [lx, 3, lz], [hx, 3, hz], 'stone')
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.topY(x, z) === 0 && grid.get(x, 0, z) === 'water')
        blob(grid, [x, 0, z], rng.int(1, 2), 'stone', 0.8, 20)
    }
    const pierZ = Math.round(c)
    const pierFrom = Math.round(c + R * 0.8)
    for (let x = pierFrom; x < Math.min(size - 1, pierFrom + Math.round(size * 0.15)); x++) {
      box(grid, x, 2, pierZ - 1, x, 2, pierZ + 1, 'wood')
      if (x % 3 === 0) box(grid, x, 1, pierZ - 1, x, 1, pierZ - 1, 'wood')
    }
    const boatX = Math.min(size - 6, pierFrom + 2)
    box(grid, boatX, 1, pierZ + 3, boatX + 3, 1, pierZ + 4, 'accent')
    grid.set(boatX + 1, 2, pierZ + 3, 'wood')
    decorate(grid, rng)
    return grid
  },
}
