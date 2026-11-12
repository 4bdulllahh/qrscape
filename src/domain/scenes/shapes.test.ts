import { describe, expect, it } from 'vitest'
import { createRng } from '../seed'
import { VoxelGrid } from '../voxels'
import { decorate, detail, slab } from './shapes'

describe('detail', () => {
  it('is the base count on the smallest QR and grows with the area', () => {
    expect(detail(25, 4)).toBe(4)
    expect(detail(61, 4)).toBe(24)
  })
  it('decorates big grids more than small ones, only on top of grass', () => {
    const count = (size: number) => {
      const g = new VoxelGrid(size, 4)
      slab(g, 0, 0, 'grass')
      decorate(g, createRng(1))
      let n = 0
      for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) n += g.topY(x, z)
      return n
    }
    expect(count(61)).toBeGreaterThan(count(25) * 3)
  })
})
