import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, hash3, lantern, line, slab } from './shapes'
import type { SceneDef } from './types'

/**
 * A natural pond with a stone edge, reeds and irises, lotus pads, koi and an arched red bridge.
 * Long links (bigger QR) grow extra lobes, so the pond winds more.
 */
export const koipond: SceneDef = {
  group: 'nature',
  id: 'koipond',
  creatures: ['fish', 'dragonfly', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 1, 'soil')
    slab(grid, 2, 2, 'grass')
    const c = (size - 1) / 2
    const R = size * (0.24 + rng.next() * 0.06)
    const lobes = [{ x: c, z: c, r: R, w: rng.next() * 6, v: rng.next() * 6 }]
    for (let i = Math.max(0, Math.round((size - 25) / 12)); i > 0; i--) {
      const a = rng.next() * Math.PI * 2
      const r = R * (0.45 + rng.next() * 0.25)
      const d = R * (0.7 + rng.next() * 0.3)
      lobes.push({
        x: Math.min(size - r - 3, Math.max(r + 3, c + Math.cos(a) * d)),
        z: Math.min(size - r - 3, Math.max(r + 3, c + Math.sin(a) * d)),
        r,
        w: rng.next() * 6,
        v: rng.next() * 6,
      })
    }
    const inside = (x: number, z: number) =>
      lobes.some((l) => {
        const a = Math.atan2(z - l.z, x - l.x)
        return (
          Math.hypot(x - l.x, z - l.z) <
          l.r * (1 + 0.12 * Math.sin(a * 3 + l.w) + 0.07 * Math.sin(a * 5 + l.v))
        )
      })
    const edge = (x: number, z: number) =>
      !inside(x, z) && (inside(x + 1, z) || inside(x - 1, z) || inside(x, z + 1) || inside(x, z - 1))

    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        if (inside(x, z)) {
          grid.set(x, 2, z, null)
          grid.set(x, 1, z, 'water')
        } else if (edge(x, z)) grid.set(x, 2 + (hash3(x, 2, z) < 40 ? 1 : 0), z, 'stone')
      }

    // Reeds with the odd iris along the bank, and a few bigger rocks.
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const bank = edge(x + 1, z) || edge(x - 1, z) || edge(x, z + 1) || edge(x, z - 1)
        if (!bank || inside(x, z) || edge(x, z) || !rng.chance(0.12)) continue
        const h = rng.int(2, 4)
        line(grid, [x, 3, z], [x, 2 + h, z], 'leaf')
        if (rng.chance(0.3)) grid.set(x, 3 + h, z, rng.chance(0.5) ? 'accent' : 'petal')
      }
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(2, size - 3)
      const z = rng.int(2, size - 3)
      if (edge(x, z)) blob(grid, [x, 3, z], rng.int(1, 2), 'stone', 0.8, 20)
    }

    // Lotus pads (some flowering) and koi on the surface.
    for (let i = detail(size, rng.int(3, 5)); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      if (grid.get(x, 1, z) !== 'water') continue
      blob(grid, [x, 1, z], rng.int(1, 2), 'leaf', 0.1, 0)
      if (rng.chance(0.4)) grid.set(x, 2, z, 'petal')
    }
    for (let i = detail(size, rng.int(2, 3)); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.int(1, size - 2)
      const dx = rng.chance(0.5) ? 1 : 0
      for (let k = 0; k < 3; k++)
        if (grid.get(x + k * dx, 1, z + k * (1 - dx)) === 'water')
          grid.set(x + k * dx, 1, z + k * (1 - dx), 'fish')
    }

    // Arched red bridge across the widest water on the middle line, only as long as the water plus a step.
    const along = rng.chance(0.5)
    const at = (t: number, w: number): [number, number] =>
      along ? [t, Math.round(c) + w] : [Math.round(c) + w, t]
    let t0 = -1
    let t1 = -1
    for (let t = 0; t < size; t++)
      if (inside(...at(t, 0))) {
        if (t0 < 0) t0 = t
        t1 = t
      }
    if (t0 >= 0) {
      t0 = Math.max(0, t0 - 2)
      t1 = Math.min(size - 1, t1 + 2)
      const rise = Math.max(2, Math.round((t1 - t0) * 0.18))
      for (let t = t0; t <= t1; t++) {
        const y = 3 + Math.round(rise * Math.sin(((t - t0) / Math.max(1, t1 - t0)) * Math.PI))
        for (let w = -1; w <= 1; w++) {
          const [x, z] = at(t, w)
          grid.set(x, y, z, 'wood')
          if (Math.abs(w) === 1) {
            if ((t - t0) % 2 === 0) grid.set(x, y + 1, z, 'accent')
            grid.set(x, y + 2, z, 'accent')
          }
        }
      }
    }

    // A stone lantern on the bank, in the first corner clear of water.
    const corners = [
      [4, 4],
      [size - 5, 4],
      [4, size - 5],
      [size - 5, size - 5],
    ] as const
    const spot = corners.find(
      ([x, z]) =>
        !inside(x, z) && !inside(x + 2, z) && !inside(x - 2, z) && !inside(x, z + 2) && !inside(x, z - 2),
    )
    if (spot) {
      box(grid, spot[0] - 2, 3, spot[1] - 2, spot[0] + 2, 7, spot[1] + 2, null)
      lantern(grid, spot[0], 3, spot[1])
    }
    decorate(grid, rng)
    return grid
  },
}
