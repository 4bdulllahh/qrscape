/** Colours are 0xRRGGBB integers in sRGB, the same form three.js `Color.setHex` takes. */

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: number): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return (
    0.2126 * channel((hex >> 16) & 255) + 0.7152 * channel((hex >> 8) & 255) + 0.0722 * channel(hex & 255)
  )
}

export function contrast(a: number, b: number): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Straight sRGB blend, t = 0 gives a, t = 1 gives b. */
export function mix(a: number, b: number, t: number): number {
  const ch = (shift: number) => {
    const ca = (a >> shift) & 255
    const cb = (b >> shift) & 255
    return Math.round(ca + (cb - ca) * t) << shift
  }
  return ch(16) | ch(8) | ch(0)
}
