import { describe, expect, it } from 'vitest'
import { fileBaseName } from './download'

describe('fileBaseName', () => {
  it('uses the host without www', () => {
    expect(fileBaseName('https://www.Example.com/a?b=1')).toBe('qrscape-example-com')
  })
  it('falls back for plain text and empty names', () => {
    expect(fileBaseName('hello world')).toBe('qrscape-hello-world')
    expect(fileBaseName('!!!')).toBe('qrscape')
  })
})
