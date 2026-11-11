import { describe, expect, it } from 'vitest'
import { isDark, makeQrGrid, MAX_BYTES, QUIET_ZONE } from './qr'

describe('makeQrGrid', () => {
  it('builds a square grid with a light quiet zone and finder patterns', () => {
    const r = makeQrGrid('https://example.com')
    if (!r.ok) throw new Error('expected a grid')
    const { grid } = r
    expect(grid.dark.length).toBe(grid.size * grid.size)
    for (let i = 0; i < grid.size; i++) {
      expect(isDark(grid, i, 0)).toBe(false)
      expect(isDark(grid, 0, i)).toBe(false)
    }
    // Top-left finder pattern: dark corner, light ring, dark centre.
    expect(isDark(grid, QUIET_ZONE, QUIET_ZONE)).toBe(true)
    expect(isDark(grid, QUIET_ZONE + 1, QUIET_ZONE + 1)).toBe(false)
    expect(isDark(grid, QUIET_ZONE + 3, QUIET_ZONE + 3)).toBe(true)
  })
  it('rejects empty and too-long input', () => {
    expect(makeQrGrid('   ')).toEqual({ ok: false, reason: 'empty' })
    expect(makeQrGrid('x'.repeat(MAX_BYTES + 1))).toEqual({ ok: false, reason: 'too-long' })
  })
  it('accepts the longest allowed input', () => {
    expect(makeQrGrid('x'.repeat(MAX_BYTES)).ok).toBe(true)
  })
  it('treats out-of-range cells as light', () => {
    const r = makeQrGrid('hi')
    if (!r.ok) throw new Error('expected a grid')
    expect(isDark(r.grid, -1, 0)).toBe(false)
    expect(isDark(r.grid, r.grid.size, 0)).toBe(false)
  })
})
