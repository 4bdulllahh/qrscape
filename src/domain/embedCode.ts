export interface EmbedSettings {
  link: string
  sceneId: string
  paletteId: string
  reroll: number
  size: number
}

export const EMBED_SIZES = { small: 200, medium: 300, large: 400 } as const
export const MIN_SIZE = 80
export const MAX_SIZE = 1200

/** Escapes text for a double-quoted HTML attribute. */
export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * The snippet people paste into their site. Scene and palette are written out (not left to the seed)
 * so the world never changes when new scenes are added later.
 */
export function embedCode(origin: string, s: EmbedSettings): string {
  const attrs = [
    `link="${escapeAttr(s.link.trim())}"`,
    `scene="${escapeAttr(s.sceneId)}"`,
    `palette="${escapeAttr(s.paletteId)}"`,
    ...(s.reroll ? [`reroll="${s.reroll}"`] : []),
    `size="${s.size}"`,
  ]
  return `<script src="${escapeAttr(origin)}/qrscape.js" defer></script>\n<qr-scape ${attrs.join(' ')}></qr-scape>`
}

/** Reads the size attribute: a whole number of pixels, kept within sensible limits. */
export function parseSize(value: string | null): number {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, n)) : EMBED_SIZES.medium
}

/** Reads the reroll attribute: a non-negative whole number, 0 when missing or invalid. */
export function parseReroll(value: string | null): number {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}
