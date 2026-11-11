import type { Palette } from './voxels'

/** Mood palettes. Dark shades stay deep and light shades stay pale so every scene scans (tested). */
export const PALETTES = {
  day: {
    soil: { dark: 0x4a3524, light: 0xe6d3b0, side: 0x8a6a45 },
    grass: { dark: 0x2c5a32, light: 0xd6e8a8, side: 0x6f9e4c },
    stone: { dark: 0x3d4248, light: 0xdfe1dc, side: 0x8d9290 },
    sand: { dark: 0x6b5232, light: 0xf3e6c4, side: 0xd8c08f },
    water: { dark: 0x1f4e6b, light: 0xcfe8f0, side: 0x5c9cbf },
    trunk: { dark: 0x3b2516, light: 0xd9b48a, side: 0x6e4a2e },
    leaf: { dark: 0x1f4d2b, light: 0xc9e6a0, side: 0x5a9a48 },
  },
  blossom: {
    soil: { dark: 0x4a3428, light: 0xf2e0cc, side: 0x8a6a50 },
    grass: { dark: 0x2e5a3a, light: 0xe0f0c0, side: 0x7ab060 },
    stone: { dark: 0x3d4248, light: 0xe8e6e4, side: 0x9a9896 },
    sand: { dark: 0x6b5232, light: 0xf8ecd0, side: 0xe0c8a0 },
    water: { dark: 0x1f5070, light: 0xd0ecf6, side: 0x6ab0d0 },
    trunk: { dark: 0x3a2420, light: 0xe8c4b0, side: 0x6a4038 },
    leaf: { dark: 0x8a2a50, light: 0xffe0ec, side: 0xf0a0c0 },
  },
  autumn: {
    soil: { dark: 0x4a2e1a, light: 0xf0dcb8, side: 0x8a5a35 },
    grass: { dark: 0x5a4a1a, light: 0xf2e2a0, side: 0xb09a4a },
    stone: { dark: 0x3e3a36, light: 0xe6e0d6, side: 0x8d8578 },
    sand: { dark: 0x6a4a2a, light: 0xf5e4c0, side: 0xd8b88a },
    water: { dark: 0x23485a, light: 0xd4e6ea, side: 0x5a8aa0 },
    trunk: { dark: 0x3a2014, light: 0xe0b890, side: 0x6a3a22 },
    leaf: { dark: 0x7a2a12, light: 0xf8d080, side: 0xd06a2a },
  },
  dusk: {
    soil: { dark: 0x3f2a2e, light: 0xf0d4c4, side: 0x8a5a5a },
    grass: { dark: 0x3d3a5c, light: 0xf4cfc0, side: 0x9a7a9a },
    stone: { dark: 0x3a3346, light: 0xe8d9e0, side: 0x8a7f95 },
    sand: { dark: 0x5a3f3a, light: 0xf7dcc0, side: 0xd9a88a },
    water: { dark: 0x2e2d5a, light: 0xd8d4f0, side: 0x6a6aa8 },
    trunk: { dark: 0x35202a, light: 0xe0b8a8, side: 0x6a4048 },
    leaf: { dark: 0x4a2f4f, light: 0xf6c6c8, side: 0xb46a7f },
  },
  night: {
    soil: { dark: 0x1c2236, light: 0xc9d2e8, side: 0x3a4560 },
    grass: { dark: 0x16304a, light: 0xbfe0e0, side: 0x2f5a6a },
    stone: { dark: 0x20263a, light: 0xd6dcec, side: 0x5a6480 },
    sand: { dark: 0x2a3048, light: 0xdcdcec, side: 0x8a90a8 },
    water: { dark: 0x0f1d3a, light: 0xb8d0f0, side: 0x2a4a80 },
    trunk: { dark: 0x1a1a2e, light: 0xb0b8d8, side: 0x3a3550 },
    leaf: { dark: 0x122a40, light: 0xa8dcd0, side: 0x2a6a6a },
  },
} satisfies Record<string, Palette>

export type PaletteId = keyof typeof PALETTES
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[]

export function isPaletteId(id: string | undefined): id is PaletteId {
  return id !== undefined && id in PALETTES
}
