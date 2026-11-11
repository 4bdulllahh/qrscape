import { describe, expect, it } from 'vitest'
import { luminance } from './color'
import { PALETTE_IDS, PALETTES } from './palettes'
import { makeQrGrid } from './qr'
import { SCENES } from './scenes'
import { colorize, paletteProblems, projectTopDown, scanProblems, VoxelGrid } from './voxels'
import { makeWorld } from './world'

const LINKS = ['https://example.com', 'https://abdullahexe.online', 'hi', `https://x.com/${'a'.repeat(300)}`]

function world(link: string, scene: string, reroll = 0, palette = 'day') {
  const r = makeWorld(link, { scene, reroll, palette })
  if (!r.ok) throw new Error('expected a world')
  return r.world
}

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

describe.each(PALETTE_IDS)('palette %s', (id) => {
  it('has enough contrast between every dark and light shade', () => {
    expect(paletteProblems(PALETTES[id])).toEqual([])
  })
})

describe.each(SCENES.map((s) => s.id))('scene %s', (id) => {
  it.each(LINKS)('scans as the QR for %s in every palette', (link) => {
    for (const p of PALETTE_IDS) {
      const w = world(link, id, 0, p)
      expect(scanProblems(w.grid, w.qr, PALETTES[p])).toEqual([])
      // Split halfway between the lightest dark shade and the darkest light shade: gives back the QR.
      const shades = Object.values(PALETTES[p])
      const cut =
        (Math.max(...shades.map((s) => luminance(s.dark))) +
          Math.min(...shades.map((s) => luminance(s.light)))) /
        2
      expect(projectTopDown(w.grid, w.qr, PALETTES[p]).map((c) => luminance(c) < cut)).toEqual(w.qr.dark)
    }
  })
  it('is the same world for the same link and differs on reroll', () => {
    const a = world('https://example.com', id).voxels
    const b = world('https://example.com', id).voxels
    const c = world('https://example.com', id, 1).voxels
    expect(a.positions).toEqual(b.positions)
    expect(a.positions).not.toEqual(c.positions)
  })
})

describe('makeWorld', () => {
  it('lets the seed pick scene and palette, and respects overrides', () => {
    const auto = makeWorld('https://example.com')
    const forced = makeWorld('https://example.com', { palette: 'night' })
    if (!auto.ok || !forced.ok) throw new Error('expected worlds')
    expect(forced.world.paletteId).toBe('night')
    expect(forced.world.sceneId).toBe(auto.world.sceneId)
    expect(makeWorld('https://example.com', { palette: 'nope' })).toMatchObject({ ok: true })
  })
  it('passes QR errors through', () => {
    expect(makeWorld('  ')).toEqual({ ok: false, reason: 'empty' })
  })
})

describe('colorize', () => {
  it('keeps hidden voxels out and full contrast only in the QR view', () => {
    const r = makeQrGrid('hi')
    if (!r.ok) throw new Error('expected a QR')
    const qr = r.grid
    const g = new VoxelGrid(qr.size, 4)
    for (let z = 0; z < qr.size; z++)
      for (let x = 0; x < qr.size; x++) for (let y = 0; y < 3; y++) g.set(x, y, z, 'soil')
    const c = colorize(g, qr, PALETTES.day)
    // A 3-high slab: tops plus the outer walls are visible, the inside is not.
    expect(c.count).toBe(qr.size * qr.size + (qr.size * 4 - 4) * 2)
    expect(c.qrColors).not.toEqual(c.sceneryColors)
  })
})
