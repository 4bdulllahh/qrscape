import { describe, expect, it } from 'vitest'
import { luminance } from './color'
import { DAY } from './palettes'
import { makeQrGrid, type QrGrid } from './qr'
import { buildScene, SCENES } from './scenes'
import { colorize, paletteProblems, projectTopDown, scanProblems, VoxelGrid } from './voxels'

function qrFor(link: string): QrGrid {
  const r = makeQrGrid(link)
  if (!r.ok) throw new Error('expected a QR')
  return r.grid
}

const LINKS = ['https://example.com', 'https://abdullahexe.online', 'hi', `https://x.com/${'a'.repeat(300)}`]

describe('voxel grid', () => {
  it('stores, reads and ignores writes outside the box', () => {
    const g = new VoxelGrid(4, 3)
    g.set(1, 2, 3, 'leaf')
    g.set(9, 9, 9, 'leaf')
    expect(g.get(1, 2, 3)).toBe('leaf')
    expect(g.get(9, 9, 9)).toBeUndefined()
    expect(g.topY(1, 3)).toBe(2)
    expect(g.topY(0, 0)).toBe(-1)
  })
})

describe('palettes', () => {
  it('DAY has enough contrast between every dark and light shade', () => {
    expect(paletteProblems(DAY)).toEqual([])
  })
})

describe.each(SCENES.map((s) => s.id))('scene %s', (id) => {
  it.each(LINKS)('scans as the QR for %s', (link) => {
    const qr = qrFor(link)
    const { grid } = buildScene(link, qr.size, 0, id)
    expect(scanProblems(grid, qr, DAY)).toEqual([])
    // The top-down view, split at the middle brightness, gives back the exact QR pattern.
    const top = projectTopDown(grid, qr, DAY)
    expect(top.map((c) => luminance(c) < 0.18)).toEqual(qr.dark)
  })
  it('is the same world for the same link and differs on reroll', () => {
    const qr = qrFor('https://example.com')
    const a = colorize(buildScene('https://example.com', qr.size, 0, id).grid, qr, DAY)
    const b = colorize(buildScene('https://example.com', qr.size, 0, id).grid, qr, DAY)
    const c = colorize(buildScene('https://example.com', qr.size, 1, id).grid, qr, DAY)
    expect(a.positions).toEqual(b.positions)
    expect(a.positions).not.toEqual(c.positions)
  })
})

describe('colorize', () => {
  it('keeps hidden voxels out and full contrast only in the QR view', () => {
    const qr = qrFor('hi')
    const g = new VoxelGrid(qr.size, 4)
    for (let z = 0; z < qr.size; z++)
      for (let x = 0; x < qr.size; x++) for (let y = 0; y < 3; y++) g.set(x, y, z, 'soil')
    const c = colorize(g, qr, DAY)
    // A 3-high slab: tops plus the outer walls are visible, the inside is not.
    const walls = (qr.size * 4 - 4) * 2
    expect(c.count).toBe(qr.size * qr.size + walls)
    expect(c.qrColors).not.toEqual(c.sceneryColors)
  })
})
