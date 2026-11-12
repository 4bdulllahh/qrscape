import { detail } from './scenes/shapes'
import type { Rng } from './seed'
import type { Material, Palette, VoxelGrid } from './voxels'

export const CREATURE_KINDS = ['butterfly', 'bird', 'dragonfly', 'petal', 'fish', 'steam'] as const
export type CreatureKind = (typeof CREATURE_KINDS)[number]

/**
 * A small animated creature that only lives in the scenery view. It is drawn on top of the voxels,
 * never part of them, so it can't touch the QR, and the renderer fades it out before the QR shows.
 */
export interface Creature {
  kind: CreatureKind
  /** Centre of its flight path, in grid cells (x, z) and voxels up (y). */
  x: number
  y: number
  z: number
  /** How far it wanders from the centre, in cells. */
  range: number
  speed: number
  phase: number
  /** Body / wing colours (sRGB hex). */
  colors: [number, number]
}

const PERCH: Material[] = ['grass', 'leaf', 'petal', 'accent']

/** Places creatures for a scene. Uses its own random source, so scenes look the same with or without them. */
export function makeCreatures(
  grid: VoxelGrid,
  palette: Palette,
  rng: Rng,
  kinds: readonly CreatureKind[],
): Creature[] {
  const { size } = grid
  const tops: { x: number; y: number; z: number; m: Material | undefined }[] = []
  let highest = 0
  for (let z = 0; z < size; z++)
    for (let x = 0; x < size; x++) {
      const y = grid.topY(x, z)
      tops.push({ x, y, z, m: grid.get(x, y, z) })
      highest = Math.max(highest, y)
    }
  const side = (m: Material) => palette[m].side
  const out: Creature[] = []
  const spot = (on: Material[]) => {
    const fit = tops.filter((t) => t.m && on.includes(t.m))
    return fit.length ? rng.pick(fit) : undefined
  }

  for (const kind of kinds) {
    if (kind === 'butterfly')
      for (let i = Math.min(12, detail(size, 2)); i > 0; i--) {
        const at = spot(PERCH)
        if (!at) break
        const wing = rng.pick([side('petal'), side('accent'), side('snow')])
        out.push({
          kind,
          x: at.x,
          y: at.y + 2 + rng.next() * 2,
          z: at.z,
          range: 1.5 + rng.next() * 2.5,
          speed: 0.5 + rng.next() * 0.4,
          phase: rng.next() * 100,
          colors: [side('trunk'), wing],
        })
      }
    else if (kind === 'bird')
      for (let i = Math.min(4, 1 + Math.floor(size / 30)); i > 0; i--)
        out.push({
          kind,
          x: size / 2 + (rng.next() - 0.5) * size * 0.3,
          y: highest + 3 + rng.next() * 3,
          z: size / 2 + (rng.next() - 0.5) * size * 0.3,
          range: size * (0.22 + rng.next() * 0.15),
          speed: (0.25 + rng.next() * 0.15) * (rng.chance(0.5) ? 1 : -1),
          phase: rng.next() * 100,
          colors: [side('stone'), side('snow')],
        })
    else if (kind === 'petal')
      // Falling blossom: starts in the crown, drifts down to the ground, starts again (hidden in the leaves).
      for (let i = Math.min(16, detail(size, 4)); i > 0; i--) {
        const at = spot(['petal'])
        if (!at) break
        const petal = side('petal')
        out.push({
          kind,
          x: at.x,
          y: at.y,
          z: at.z,
          range: 1 + rng.next() * 2,
          speed: 0.8 + rng.next() * 0.5,
          phase: rng.next() * 100,
          colors: [petal, petal],
        })
      }
    else if (kind === 'steam')
      // Puffs of steam or mist rising off water and fading into the air.
      for (let i = Math.min(14, Math.max(4, detail(size, 4))); i > 0; i--) {
        const at = spot(['water'])
        if (!at) break
        const puff = side('snow')
        out.push({
          kind,
          x: at.x,
          y: at.y + 1,
          z: at.z,
          range: 0.4,
          speed: 0.6 + rng.next() * 0.4,
          phase: rng.next() * 100,
          colors: [puff, puff],
        })
      }
    else if (kind === 'fish')
      // Swims in small circles at the water surface.
      for (let i = Math.min(6, Math.max(2, detail(size, 1.5))); i > 0; i--) {
        const at = spot(['water', 'fish'])
        if (!at) break
        out.push({
          kind,
          x: at.x,
          y: at.y + 0.6,
          z: at.z,
          range: 1.2 + rng.next() * 1.5,
          speed: (0.5 + rng.next() * 0.4) * (rng.chance(0.5) ? 1 : -1),
          phase: rng.next() * 100,
          colors: [side('fish'), side('snow')],
        })
      }
    else
      for (let i = Math.min(6, detail(size, 1.5)); i > 0; i--) {
        const at = spot(['water'])
        if (!at) break
        out.push({
          kind,
          x: at.x,
          y: at.y + 1.5 + rng.next(),
          z: at.z,
          range: 2 + rng.next() * 2,
          speed: 0.8 + rng.next() * 0.5,
          phase: rng.next() * 100,
          colors: [side('accent'), side('glass')],
        })
      }
  }
  return out
}
