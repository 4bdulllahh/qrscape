import qrcode from 'qrcode-generator'

/** A square QR pattern, row-major. `dark[y * size + x]` is true for a dark module. Includes the quiet zone. */
export interface QrGrid {
  size: number
  dark: boolean[]
}

/** Light border around the code. The spec asks for 4 modules; scanners read 2 fine and the scene stays tighter. */
export const QUIET_ZONE = 2
/** Bytes that fit a version 40 code at error correction H. */
export const MAX_BYTES = 1273

// The library reads strings as Latin-1 by default; links can hold any Unicode.
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s))

export type QrResult = { ok: true; grid: QrGrid } | { ok: false; reason: 'empty' | 'too-long' }

/** Error correction H: up to 30% of the code can be covered by scenery details and it still scans. */
export function makeQrGrid(text: string): QrResult {
  const value = text.trim()
  if (!value) return { ok: false, reason: 'empty' }
  if (new TextEncoder().encode(value).length > MAX_BYTES) return { ok: false, reason: 'too-long' }

  const qr = qrcode(0, 'H')
  qr.addData(value, 'Byte')
  qr.make()

  const modules = qr.getModuleCount()
  const size = modules + QUIET_ZONE * 2
  const dark = Array.from({ length: size * size }, () => false)
  for (let y = 0; y < modules; y++)
    for (let x = 0; x < modules; x++) dark[(y + QUIET_ZONE) * size + x + QUIET_ZONE] = qr.isDark(y, x)
  return { ok: true, grid: { size, dark } }
}

export function isDark(grid: QrGrid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < grid.size && y < grid.size && grid.dark[y * grid.size + x] === true
}
