import type { Rng } from '../seed'
import type { VoxelGrid } from '../voxels'

export type SceneGroup = 'nature' | 'city'
export const SCENE_GROUPS: readonly SceneGroup[] = ['nature', 'city']

export interface SceneDef {
  id: string
  /** Where it sits in the scene picker. */
  group: SceneGroup
  /** Fills a grid `size` wide. Every column must end up with at least one voxel. */
  build(size: number, rng: Rng): VoxelGrid
}
