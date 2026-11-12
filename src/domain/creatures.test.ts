import { describe, expect, it } from 'vitest'
import { SCENES } from './scenes'
import { makeWorld } from './world'

const world = (link: string, scene: string) => {
  const r = makeWorld(link, { scene })
  if (!r.ok) throw new Error('expected a world')
  return r.world
}

describe('creatures', () => {
  it('every scene gets some, placed over its own grid', () => {
    for (const s of SCENES) {
      const w = world('https://example.com', s.id)
      expect(w.voxels.creatures.length, s.id).toBeGreaterThan(0)
      for (const c of w.voxels.creatures) {
        expect(c.x, s.id).toBeGreaterThanOrEqual(0)
        expect(c.x, s.id).toBeLessThan(w.grid.size)
        expect(c.y, s.id).toBeGreaterThan(0)
      }
    }
  })
  it('are the same for the same link and more for a longer one', () => {
    const short = world('https://example.com', 'tree').voxels.creatures
    expect(world('https://example.com', 'tree').voxels.creatures).toEqual(short)
    expect(world(`https://example.com/${'a'.repeat(200)}`, 'tree').voxels.creatures.length).toBeGreaterThan(
      short.length,
    )
  })
})
