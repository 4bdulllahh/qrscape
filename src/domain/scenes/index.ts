import { createRng, seedFor } from '../seed'
import type { VoxelGrid } from '../voxels'
import { meadow } from './meadow'
import type { SceneDef } from './types'

export const SCENES: readonly SceneDef[] = [meadow]

/** The link's own scene, picked by its seed, unless the user chose one. */
export function buildScene(
  link: string,
  size: number,
  reroll = 0,
  sceneId?: string,
): { id: string; grid: VoxelGrid } {
  const rng = createRng(seedFor(link, reroll))
  const picked = rng.pick(SCENES)
  const scene = SCENES.find((s) => s.id === sceneId) ?? picked
  return { id: scene.id, grid: scene.build(size, rng) }
}
