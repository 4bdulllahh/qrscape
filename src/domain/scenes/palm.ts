import type { Rng } from '../seed'
import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, hash3, slab } from './shapes'
import type { SceneDef } from './types'

/** A coconut palm: curved ringed trunk, a crown of long arching fronds and coconuts. */
function palmTree(
  grid: VoxelGrid,
  rng: Rng,
  x: number,
  base: number,
  z: number,
  h: number,
  thick: number,
): void {
  const a = rng.next() * Math.PI * 2
  const bend = h * (0.2 + rng.next() * 0.15)
  let tx = x
  let tz = z
  for (let i = 0; i <= h; i++) {
    const t = i / h
    tx = Math.round(x + Math.cos(a) * bend * t * t)
    tz = Math.round(z + Math.sin(a) * bend * t * t)
    box(grid, tx, base + i, tz, tx + thick - 1, base + i, tz + thick - 1, i % 2 ? 'wood' : 'trunk')
  }
  const top = base + h
  const fronds = rng.int(7, 9)
  const len = Math.max(4, h * 0.45)
  const steps = Math.round(len)
  for (let f = 0; f < fronds; f++) {
    const fa = (f / fronds) * Math.PI * 2 + rng.next() * 0.3
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      // Rises a little, then arches down.
      const y = Math.round(top + 2 * t - 4 * t * t * (len / 6))
      const fx = Math.round(tx + Math.cos(fa) * s)
      const fz = Math.round(tz + Math.sin(fa) * s)
      grid.set(fx, y, fz, 'leaf')
      if (s > 1 && s < steps)
        grid.set(fx + Math.round(-Math.sin(fa)), y, fz + Math.round(Math.cos(fa)), 'leaf')
    }
  }
  grid.set(tx, top + 1, tz, 'leaf')
  for (let i = rng.int(2, 4); i > 0; i--) grid.set(tx + rng.int(-1, 1), top - 1, tz + rng.int(-1, 1), 'pot')
}

/** A sandy island in the sea with a leaning coconut palm. Long links grow more palms and a straw hut. */
export const palm: SceneDef = {
  group: 'nature',
  id: 'palm',
  creatures: ['bird', 'fish'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'water')
    const c = (size - 1) / 2
    const R = size * (0.32 + rng.next() * 0.05)
    const wobble = rng.next() * Math.PI * 2
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const a = Math.atan2(z - c, x - c)
        const d = Math.hypot(x - c, z - c)
        const edge = R * (1 + 0.14 * Math.sin(a * 2 + wobble))
        if (d > edge) continue
        grid.set(x, 0, z, 'sand')
        if (d < edge - 2) grid.set(x, 1, z, d < edge * 0.45 && hash3(x, 1, z) < 50 ? 'grass' : 'sand')
      }
    palmTree(
      grid,
      rng,
      Math.round(c),
      2,
      Math.round(c),
      Math.round(size * (0.45 + rng.next() * 0.1)),
      size >= 41 ? 2 : 1,
    )
    for (let i = Math.max(0, detail(size, 0.8) - 1); i > 0; i--) {
      const a = rng.next() * Math.PI * 2
      const d = R * (0.4 + rng.next() * 0.3)
      const h = rng.int(6, Math.max(7, Math.round(size * 0.3)))
      palmTree(grid, rng, Math.round(c + Math.cos(a) * d), 2, Math.round(c + Math.sin(a) * d), h, 1)
    }
    // Shells and rocks on the beach, and on bigger QRs a straw hut.
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(2, size - 3)
      const z = rng.int(2, size - 3)
      if (grid.get(x, grid.topY(x, z), z) === 'sand')
        grid.set(x, grid.topY(x, z) + 1, z, rng.chance(0.5) ? 'snow' : 'stone')
    }
    if (size >= 37) {
      const hx = Math.round(c - R * 0.45)
      const hz = Math.round(c + R * 0.3)
      for (const [dx, dz] of [
        [-2, -2],
        [2, -2],
        [-2, 2],
        [2, 2],
      ] as const)
        box(grid, hx + dx, 2, hz + dz, hx + dx, 4, hz + dz, 'wood')
      for (let i = 0; i <= 3; i++)
        box(grid, hx - 3 + i, 5 + i, hz - 3 + i, hx + 3 - i, 5 + i, hz + 3 - i, 'sand')
    }
    blob(grid, [Math.round(c + R * 0.5), 2, Math.round(c - R * 0.4)], 1.5, 'stone', 0.7, 20)
    decorate(grid, rng)
    return grid
  },
}
