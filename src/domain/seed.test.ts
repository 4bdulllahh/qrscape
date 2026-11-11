import { describe, expect, it } from 'vitest'
import { createRng, hashText, seedFor } from './seed'

describe('seed', () => {
  it('gives the same seed for the same link, ignoring outer spaces', () => {
    expect(seedFor('https://example.com')).toBe(seedFor('  https://example.com '))
  })
  it('gives different seeds for different links and rerolls', () => {
    const seeds = new Set([seedFor('https://a.com'), seedFor('https://b.com'), seedFor('https://a.com', 1)])
    expect(seeds.size).toBe(3)
  })
  it('handles Unicode', () => {
    expect(hashText('ok')).not.toBe(hashText('\u00f6k'))
  })
  it('repeats the same sequence from the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next())
  })
  it('keeps int() in range and spreads values', () => {
    const rng = createRng(7)
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(1, 6)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(6)
      seen.add(n)
    }
    expect(seen.size).toBe(6)
  })
  it('refuses to pick from an empty list', () => {
    expect(() => createRng(1).pick([])).toThrow()
  })
})
