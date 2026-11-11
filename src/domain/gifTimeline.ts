export interface Frame {
  azimuth: number
  /** 0 scenery, 1 QR. */
  morph: number
  /** Seconds, drives the idle sway. */
  time: number
}

export const GIF_FPS = 12
const ORBIT_SECONDS = 4
const MORPH_SECONDS = 1.1
const HOLD_SECONDS = 1.5
/** The orbit swings from -SWING to +SWING. Both ends snap to the same quarter turn, so the loop is seamless. */
const SWING = 0.3

/** Scenery orbit, morph to QR, hold, morph back. The last frame leads straight into the first. */
export function gifTimeline(fps = GIF_FPS): Frame[] {
  const frames: Frame[] = []
  let time = 0
  const add = (count: number, at: (t: number) => Omit<Frame, 'time'>) => {
    for (let i = 0; i < count; i++) {
      frames.push({ ...at(i / count), time })
      time += 1 / fps
    }
  }
  const morphFrames = Math.round(MORPH_SECONDS * fps)
  add(Math.round(ORBIT_SECONDS * fps), (t) => ({ azimuth: -SWING + 2 * SWING * t, morph: 0 }))
  add(morphFrames, (t) => ({ azimuth: SWING, morph: t }))
  add(Math.round(HOLD_SECONDS * fps), () => ({ azimuth: SWING, morph: 1 }))
  add(morphFrames, (t) => ({ azimuth: -SWING, morph: 1 - t }))
  return frames
}
