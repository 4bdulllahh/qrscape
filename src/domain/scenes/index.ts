import { bamboo } from './bamboo'
import { baobab } from './baobab'
import { bonsai } from './bonsai'
import { cactus } from './cactus'
import { cherryblossom } from './cherryblossom'
import { coffeeshop } from './coffeeshop'
import { fishbowl } from './fishbowl'
import { koipond } from './koipond'
import { lighthouse } from './lighthouse'
import { mountains } from './mountains'
import { palm } from './palm'
import { pine } from './pine'
import { ramenstall } from './ramenstall'
import { teahouse } from './teahouse'
import { tofushop } from './tofushop'
import { torii } from './torii'
import { tree } from './tree'
import type { SceneDef } from './types'
export { SCENE_GROUPS, type SceneGroup } from './types'
import { zengarden } from './zengarden'

export const SCENES: readonly SceneDef[] = [
  tree,
  bonsai,
  mountains,
  fishbowl,
  zengarden,
  cherryblossom,
  koipond,
  bamboo,
  torii,
  teahouse,
  coffeeshop,
  tofushop,
  ramenstall,
  lighthouse,
  cactus,
  pine,
  baobab,
  palm,
]
