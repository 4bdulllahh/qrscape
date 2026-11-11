import { describe, expect, it } from 'vitest'
import { PALETTE_IDS } from '../domain/palettes'
import { SCENES } from '../domain/scenes'
import { strings, t } from './strings'

describe('strings', () => {
  it('has no em dash, en dash or ellipsis character', () => {
    for (const [key, value] of Object.entries(strings)) expect(value, key).not.toMatch(/[–—…]/)
  })
  it('fills template values', () => {
    expect(t('auto', { name: 'Tree' })).toBe('Surprise me (Tree)')
  })
  it('names every scene and palette', () => {
    for (const s of SCENES) expect(strings).toHaveProperty(`scene_${s.id}`)
    for (const p of PALETTE_IDS) expect(strings).toHaveProperty(`palette_${p}`)
  })
})
