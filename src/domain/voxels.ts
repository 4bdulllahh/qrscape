import { contrast, luminance, mix } from './color'
import { isDark, type QrGrid } from './qr'

export const MATERIALS = ['soil', 'grass', 'stone', 'sand', 'water', 'trunk', 'leaf'] as const
export type Material = (typeof MATERIALS)[number]

/** Each material has a shade for dark QR modules, one for light modules, and a natural side colour. */
export interface Shade {
  dark: number
  light: number
  side: number
}
export type Palette = Record<Material, Shade>

/** Minimum contrast between any dark shade and any light shade, so every top-down view scans. */
export const MIN_CONTRAST = 3

/**
 * A dense box of voxels. x and z are QR columns and rows, y is up.
 * Stored as material index + 1 (0 means empty).
 */
export class VoxelGrid {
  private readonly cells: Uint8Array

  constructor(
    readonly size: number,
    readonly height: number,
  ) {
    this.cells = new Uint8Array(size * size * height)
  }

  inside(x: number, y: number, z: number): boolean {
    return x >= 0 && z >= 0 && y >= 0 && x < this.size && z < this.size && y < this.height
  }

  private index(x: number, y: number, z: number): number {
    return (y * this.size + z) * this.size + x
  }

  /** Writes outside the box are ignored, so scene code can draw shapes near the edges freely. */
  set(x: number, y: number, z: number, material: Material | null): void {
    if (!this.inside(x, y, z)) return
    this.cells[this.index(x, y, z)] = material === null ? 0 : MATERIALS.indexOf(material) + 1
  }

  get(x: number, y: number, z: number): Material | undefined {
    if (!this.inside(x, y, z)) return undefined
    const v = this.cells[this.index(x, y, z)] ?? 0
    return v === 0 ? undefined : MATERIALS[v - 1]
  }

  /** Height of the highest voxel in a column, or -1 when the column is empty. */
  topY(x: number, z: number): number {
    for (let y = this.height - 1; y >= 0; y--) if (this.get(x, y, z) !== undefined) return y
    return -1
  }
}

export interface ColoredVoxels {
  size: number
  height: number
  count: number
  /** x, y, z per voxel. */
  positions: Int16Array
  /** Colour in the scenery view (soft QR on the tops) and in the QR view (full contrast tops). */
  sceneryColors: Uint32Array
  qrColors: Uint32Array
  /** Idle motion per voxel: 0 still, 1 sways (leaves), 2 bobs (water). */
  motion: Uint8Array
}

const MOTION: Partial<Record<Material, number>> = { leaf: 1, water: 2 }

/** How much of the QR shows on the tops in the scenery view: 0 is pure nature, 1 is the full QR. */
const SCENERY_QR_STRENGTH = 0.55

/** Keeps only voxels with a face that can be seen (not the bottom) and colours them. */
export function colorize(grid: VoxelGrid, qr: QrGrid, palette: Palette): ColoredVoxels {
  const positions: number[] = []
  const scenery: number[] = []
  const qrColors: number[] = []
  const motion: number[] = []
  const open = (x: number, y: number, z: number) => grid.get(x, y, z) === undefined

  for (let z = 0; z < grid.size; z++)
    for (let x = 0; x < grid.size; x++) {
      const top = grid.topY(x, z)
      for (let y = 0; y <= top; y++) {
        const m = grid.get(x, y, z)
        if (m === undefined) continue
        const visible =
          open(x, y + 1, z) ||
          open(x + 1, y, z) ||
          open(x - 1, y, z) ||
          open(x, y, z + 1) ||
          open(x, y, z - 1)
        if (!visible) continue
        const shade = palette[m]
        positions.push(x, y, z)
        motion.push(MOTION[m] ?? 0)
        if (y === top) {
          const target = isDark(qr, x, z) ? shade.dark : shade.light
          scenery.push(mix(shade.side, target, SCENERY_QR_STRENGTH))
          qrColors.push(target)
        } else {
          scenery.push(shade.side)
          qrColors.push(shade.side)
        }
      }
    }

  return {
    size: grid.size,
    height: grid.height,
    count: positions.length / 3,
    positions: Int16Array.from(positions),
    sceneryColors: Uint32Array.from(scenery),
    qrColors: Uint32Array.from(qrColors),
    motion: Uint8Array.from(motion),
  }
}

/** What a camera straight above sees in the QR view: one colour per cell, row-major. -1 for an empty column. */
export function projectTopDown(grid: VoxelGrid, qr: QrGrid, palette: Palette): number[] {
  const out: number[] = []
  for (let z = 0; z < grid.size; z++)
    for (let x = 0; x < grid.size; x++) {
      const y = grid.topY(x, z)
      const m = y < 0 ? undefined : grid.get(x, y, z)
      out.push(m === undefined ? -1 : isDark(qr, x, z) ? palette[m].dark : palette[m].light)
    }
  return out
}

/** Problems that would stop a phone from reading the top-down view. Empty means it scans. */
export function scanProblems(grid: VoxelGrid, qr: QrGrid, palette: Palette): string[] {
  const problems: string[] = []
  if (grid.size !== qr.size) problems.push(`grid is ${grid.size} wide, QR is ${qr.size}`)
  const top = projectTopDown(grid, qr, palette)
  const empty = top.filter((c) => c === -1).length
  if (empty > 0) problems.push(`${empty} empty columns`)
  problems.push(...paletteProblems(palette))
  return problems
}

export function paletteProblems(palette: Palette): string[] {
  const problems: string[] = []
  for (const a of MATERIALS)
    for (const b of MATERIALS) {
      const dark = palette[a].dark
      const light = palette[b].light
      const c = contrast(dark, light)
      if (luminance(dark) >= luminance(light) || c < MIN_CONTRAST)
        problems.push(`${a} dark vs ${b} light contrast ${c.toFixed(2)}`)
    }
  return problems
}
