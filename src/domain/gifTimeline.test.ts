import { describe, expect, it } from 'vitest'
import { GIF_FPS, gifTimeline } from './gifTimeline'

describe('gifTimeline', () => {
  const frames = gifTimeline()

  it('runs about 8 seconds', () => {
    expect(frames.length / GIF_FPS).toBeGreaterThan(7)
    expect(frames.length / GIF_FPS).toBeLessThan(9)
  })
  it('holds the full QR for a while', () => {
    expect(frames.filter((f) => f.morph === 1).length).toBeGreaterThanOrEqual(GIF_FPS)
  })
  it('loops without a jump: last frame is one step before the first', () => {
    const first = frames[0]
    const last = frames.at(-1)
    expect(first?.morph).toBe(0)
    expect(last?.morph).toBeLessThan(0.1)
    expect(last?.azimuth).toBe(first?.azimuth)
    expect(last?.time).toBeCloseTo(-1 / GIF_FPS)
    expect(first?.time).toBe(0)
  })
  it('snaps both orbit ends to the same quarter turn', () => {
    const quarter = Math.PI / 2
    const ends = frames.filter((f) => f.morph > 0).map((f) => Math.round(f.azimuth / quarter))
    expect(new Set(ends).size).toBe(1)
  })
})
