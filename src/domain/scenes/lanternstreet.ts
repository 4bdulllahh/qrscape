import type { Rng } from '../seed'
import { VoxelGrid } from '../voxels'
import { blob, box, decorate, detail, slab } from './shapes'
import type { SceneDef } from './types'

/** A two-storey wooden townhouse (machiya) facing the street at z = face, with a lattice front and noren. */
function machiya(
  grid: VoxelGrid,
  rng: Rng,
  x0: number,
  x1: number,
  back: number,
  face: number,
  low: boolean,
): void {
  const dir = Math.sign(face - back)
  const [z0, z1] = [Math.min(back, face), Math.max(back, face)]
  // The row nearest the camera is single-storey so the street stays in view.
  const top = low ? 5 : rng.int(7, 9)
  box(grid, x0, 2, z0, x1, top, z1, 'wood')
  // Lattice front: slats on the ground floor, paper window upstairs.
  for (let x = x0; x <= x1; x++) if (x % 2) box(grid, x, 2, face, x, 5, face, 'trunk')
  if (!low) box(grid, x0 + 1, 7, face, x1 - 1, top - 1, face, 'cloth')
  // Lower and upper tiled roofs leaning out over the street.
  if (!low) box(grid, x0, 6, face + dir, x1, 6, face + dir, 'roof')
  for (let i = 0; i < 3; i++)
    box(grid, x0, top + 1 + i, back + dir * i, x1, top + 1 + i, face - dir * i + dir, 'roof')
  // Noren in the doorway.
  const door = rng.int(x0 + 1, x1 - 2)
  box(grid, door, 4, face + dir, door + 1, 5, face + dir, rng.chance(0.5) ? 'accent' : 'cloth')
}

/**
 * An old lantern-lit street in Kyoto: stone paving between rows of wooden townhouses, strings of red
 * paper lanterns overhead, potted plants and a sleeping cat.
 */
export const lanternstreet: SceneDef = {
  group: 'city',
  id: 'lanternstreet',
  creatures: ['bird', 'butterfly'],
  build(size, rng) {
    const grid = new VoxelGrid(size, size)
    slab(grid, 0, 0, 'soil')
    slab(grid, 1, 1, 'stone')
    const c = Math.round((size - 1) / 2)
    const sw = Math.max(3, Math.round(size * 0.12))
    const southFace = c + sw
    const northFace = c - sw
    const depth = Math.max(4, Math.round(size * 0.2))

    // Paving: a lighter centre line of slabs.
    for (let x = 0; x < size; x += 2) box(grid, x, 1, c - 1, x, 1, c + 1, 'sand')
    // Houses on both sides, each a few voxels wide.
    for (const side of [-1, 1]) {
      let x = 0
      while (x < size - 3) {
        const w = rng.int(6, 9)
        const face = side < 0 ? northFace - 1 : southFace + 1
        machiya(
          grid,
          rng,
          x,
          Math.min(size - 1, x + w - 1),
          side < 0 ? Math.max(0, face - depth) : Math.min(size - 1, face + depth),
          face,
          side > 0,
        )
        x += w + 1
      }
    }
    // Strings of lanterns across the street.
    for (let x = 2; x < size - 2; x += Math.max(4, Math.round(size / 7))) {
      for (let z = northFace; z <= southFace; z++) grid.set(x, 9, z, 'roof')
      for (let z = northFace + 1; z < southFace; z += 2) blob(grid, [x, 8, z], 0.8, 'accent', 1.2, 0)
    }
    // Potted plants along the house fronts, a bench and a cat.
    for (let i = detail(size, 2); i > 0; i--) {
      const x = rng.int(1, size - 2)
      const z = rng.chance(0.5) ? northFace : southFace
      if (grid.topY(x, z) > 1) continue
      grid.set(x, 2, z, 'pot')
      grid.set(x, 3, z, 'leaf')
    }
    const cx = rng.int(3, size - 4)
    box(grid, cx, 2, c + 2, cx + 1, 2, c + 2, 'soil')
    grid.set(cx + 1, 3, c + 2, 'soil')
    decorate(grid, rng)
    return grid
  },
}
