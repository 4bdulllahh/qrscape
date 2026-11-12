import { VoxelGrid } from '../voxels'
import { blob, detail, hash3, slab } from './shapes'
import type { SceneDef } from './types'

/** A round glass bowl on a table: gravel, seaweed, a rock cave and fish swimming at the surface. */
export const fishbowl: SceneDef = {
  group: 'nature',
  id: 'fishbowl',
  creatures: ['fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'wood')
    const c = (size - 1) / 2
    const R = size * (0.32 + rng.next() * 0.05)
    const cy = R * 0.75
    const rimY = Math.round(cy + R * 0.55)
    const waterY = rimY - rng.int(1, 2)

    for (let y = 1; y <= rimY; y++) {
      const r = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2))
      for (let z = 0; z < size; z++)
        for (let x = 0; x < size; x++) {
          const d = Math.hypot(x - c, z - c)
          if (d > r) continue
          // Glass at the base and rim; a curved shine down one side, like light on real glass.
          const angle = Math.atan2(z - c, x - c)
          const shine = d > r - 1.2 && Math.abs(angle - 2.2) < 0.18 && y > 3 && y < rimY - 1
          if (y <= 1 || (d > r - 1.2 && y >= rimY)) grid.set(x, y, z, 'glass')
          else if (shine) grid.set(x, y, z, 'snow')
          else if (y === 2) grid.set(x, y, z, hash3(x, y, z) < 30 ? 'stone' : 'sand')
          else if (y <= waterY) grid.set(x, y, z, 'water')
        }
    }

    // Seaweed: wavy stalks, a couple poking out of the water. More of them in bigger bowls.
    for (let i = Math.max(2, detail(size, 1)); i > 0; i--) {
      const a = rng.next() * Math.PI * 2
      const dist = rng.next() * R * 0.6
      let wx = Math.round(c + Math.cos(a) * dist)
      const pz = Math.round(c + Math.sin(a) * dist)
      const top = waterY + (i <= 2 ? 2 : -rng.int(1, 3))
      for (let y = 3; y <= top; y++) {
        if (rng.chance(0.4)) wx += rng.int(-1, 1)
        grid.set(wx, y, pz, 'leaf')
      }
    }
    // A little rock cave on the gravel.
    blob(
      grid,
      [Math.round(c + rng.int(-3, 3)), 3, Math.round(c + rng.int(-3, 3))],
      Math.max(2, R * 0.18),
      'stone',
      0.8,
    )

    // Fish at the surface: a 3-voxel body with a tail, pointing a seeded way.
    for (let i = detail(size, rng.int(2, 3)); i > 0; i--) {
      const fx = Math.round(c + rng.int(-Math.floor(R / 2), Math.floor(R / 2)))
      const fz = Math.round(c + rng.int(-Math.floor(R / 2), Math.floor(R / 2)))
      const along = rng.chance(0.5)
      for (let k = -1; k <= 2; k++) {
        const x = along ? fx + k : fx
        const z = along ? fz : fz + k
        if (grid.get(x, waterY, z) === 'water') grid.set(x, waterY, z, 'fish')
      }
    }
    // Fish seen through the side: on the outside of the water, halfway down.
    for (let i = rng.int(2, 3); i > 0; i--) {
      const a = rng.next() * Math.PI * 2
      const y = rng.int(3, Math.max(3, waterY - 2))
      const r = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)) - 1.5
      for (let k = -1; k <= 1; k++) {
        const x = Math.round(c + Math.cos(a + k * 0.12) * r)
        const z = Math.round(c + Math.sin(a + k * 0.12) * r)
        if (grid.get(x, y, z) === 'water') grid.set(x, y, z, 'fish')
      }
    }
    return grid
  },
}
