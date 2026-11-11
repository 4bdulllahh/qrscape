import type { Palette } from './voxels'

/** Default daytime palette. Dark shades stay deep and light shades stay pale so every scene scans. */
export const DAY: Palette = {
  soil: { dark: 0x4a3524, light: 0xe6d3b0, side: 0x8a6a45 },
  grass: { dark: 0x2c5a32, light: 0xd6e8a8, side: 0x6f9e4c },
  stone: { dark: 0x3d4248, light: 0xdfe1dc, side: 0x8d9290 },
  sand: { dark: 0x6b5232, light: 0xf3e6c4, side: 0xd8c08f },
  water: { dark: 0x1f4e6b, light: 0xcfe8f0, side: 0x5c9cbf },
  trunk: { dark: 0x3b2516, light: 0xd9b48a, side: 0x6e4a2e },
  leaf: { dark: 0x1f4d2b, light: 0xc9e6a0, side: 0x5a9a48 },
}
