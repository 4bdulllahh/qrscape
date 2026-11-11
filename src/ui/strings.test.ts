import { describe, expect, it } from 'vitest'
import { strings, t } from './strings'

describe('strings', () => {
  it('has no em dash, en dash or ellipsis character', () => {
    for (const [key, value] of Object.entries(strings)) expect(value, key).not.toMatch(/[\u2013\u2014\u2026]/)
  })
  it('fills template values', () => {
    expect(t('appName')).toBe('QRscape')
  })
})
