import { describe, expect, it } from 'vitest'
import { embedCode, parseReroll, parseSize } from './embedCode'

describe('embedCode', () => {
  it('writes the script and the tag with the chosen world', () => {
    const code = embedCode('https://qrscape-ten.vercel.app', {
      link: ' https://example.com ',
      sceneId: 'tree',
      paletteId: 'dusk',
      reroll: 0,
      size: 300,
    })
    expect(code).toBe(
      '<script src="https://qrscape-ten.vercel.app/qrscape.js" defer></script>\n' +
        '<qr-scape link="https://example.com" scene="tree" palette="dusk" size="300"></qr-scape>',
    )
  })
  it('escapes links so they cannot break out of the attribute', () => {
    const code = embedCode('https://x.app', {
      link: 'https://a.com/?q="><script>alert(1)</script>&b=1',
      sceneId: 'tree',
      paletteId: 'day',
      reroll: 2,
      size: 200,
    })
    expect(code).toContain('link="https://a.com/?q=&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;b=1"')
    expect(code).toContain('reroll="2"')
    expect(code.match(/<script/g)).toHaveLength(1)
  })
})

describe('attribute parsing', () => {
  it('clamps size and falls back to medium', () => {
    expect(parseSize('250')).toBe(250)
    expect(parseSize('5')).toBe(80)
    expect(parseSize('99999')).toBe(1200)
    expect(parseSize(null)).toBe(300)
    expect(parseSize('big')).toBe(300)
  })
  it('reads reroll as a non-negative whole number', () => {
    expect(parseReroll('3')).toBe(3)
    expect(parseReroll('-1')).toBe(0)
    expect(parseReroll(null)).toBe(0)
  })
})
