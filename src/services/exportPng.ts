import { PALETTES } from '../domain/palettes'
import { projectTopDown } from '../domain/voxels'
import type { World } from '../domain/world'

const TARGET_PX = 1024

/** The flat top-down QR in the world's terrain colours, drawn crisp (no 3D, no blur). */
export function exportPng(world: World): Promise<Blob> {
  const colors = projectTopDown(world.grid, world.qr, PALETTES[world.paletteId])
  const n = world.qr.size
  const cell = Math.ceil(TARGET_PX / n)
  const canvas = Object.assign(document.createElement('canvas'), { width: n * cell, height: n * cell })
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas 2D is not available'))
  colors.forEach((hex, i) => {
    ctx.fillStyle = `#${Math.max(hex, 0).toString(16).padStart(6, '0')}`
    ctx.fillRect((i % n) * cell, Math.floor(i / n) * cell, cell, cell)
  })
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
  )
}
