/** A seeded random source: same seed, same sequence, like a Minecraft world seed. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [min, max], both included. */
  int(min: number, max: number): number
  /** One item of a non-empty list. */
  pick<T>(items: readonly T[]): T
  chance(p: number): boolean
}

/** Turns text into a 32-bit seed: FNV-1a over the UTF-8 bytes, then a murmur3 finaliser to spread the bits. */
export function hashText(text: string): number {
  let h = 0x811c9dc5
  for (const byte of new TextEncoder().encode(text)) {
    h ^= byte
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** The world seed for a link. `reroll` 0 is the link's own world; each reroll gives another one. */
export function seedFor(link: string, reroll = 0): number {
  return hashText(reroll === 0 ? link.trim() : `${link.trim()}#${reroll}`)
}

/** mulberry32: tiny, fast and good enough for picking shapes and colours. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() needs at least one item')
      return items[Math.floor(next() * items.length)] as (typeof items)[number]
    },
    chance: (p) => next() < p,
  }
}
