import type { Rng } from '../seed'
import type { VoxelGrid } from '../voxels'

export interface SceneDef {
  id: string
  /** Fills a grid `size` wide. Every column must end up with at least one voxel. */
  build(size: number, rng: Rng): VoxelGrid
}
