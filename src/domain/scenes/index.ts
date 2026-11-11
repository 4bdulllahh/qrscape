import { bonsai } from './bonsai'
import { cherryblossom } from './cherryblossom'
import { fishbowl } from './fishbowl'
import { koipond } from './koipond'
import { mountains } from './mountains'
import { tree } from './tree'
import type { SceneDef } from './types'
import { zengarden } from './zengarden'

export const SCENES: readonly SceneDef[] = [
  tree,
  bonsai,
  mountains,
  fishbowl,
  zengarden,
  cherryblossom,
  koipond,
]
