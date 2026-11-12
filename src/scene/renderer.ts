import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import type { Creature, CreatureKind } from '../domain/creatures'
import type { ColoredVoxels } from '../domain/voxels'

const SCENERY_ELEVATION = (32 * Math.PI) / 180
const QR_ELEVATION = Math.PI / 2
const MORPH_SECONDS = 1.1
const ORBIT_RADIANS_PER_SECOND = 0.12

/** Baked light: tops full colour (so the QR view shows exact palette colours), sides darker. No lights needed. */
function shadedCube(): BoxGeometry {
  const geo = new BoxGeometry(1, 1, 1)
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z, 4 vertices each.
  const faceShade = [0.78, 0.7, 1, 0.5, 0.88, 0.62]
  const colors: number[] = []
  for (const s of faceShade) for (let i = 0; i < 4; i++) colors.push(s, s, s)
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geo
}

/** A creature is a few small boxes. Wings (side ±1) hinge on the body and flap; the body points along local +z. */
interface Part {
  at: [number, number, number]
  size: [number, number, number]
  color: 0 | 1
  side: -1 | 0 | 1
}
const wings = (at: Part['at'], size: Part['size'], color: 0 | 1): Part[] => [
  { at, size, color, side: 1 },
  { at, size, color, side: -1 },
]
const PARTS: Record<CreatureKind, Part[]> = {
  butterfly: [
    { at: [0, 0, 0], size: [0.12, 0.12, 0.5], color: 0, side: 0 },
    ...wings([0.3, 0, 0.08], [0.55, 0.05, 0.4], 1),
    ...wings([0.24, 0, -0.18], [0.4, 0.05, 0.3], 1),
  ],
  bird: [
    { at: [0, 0, 0], size: [0.28, 0.24, 0.8], color: 0, side: 0 },
    { at: [0, 0.08, 0.45], size: [0.2, 0.2, 0.22], color: 0, side: 0 },
    ...wings([0.45, 0, 0], [0.75, 0.06, 0.32], 1),
  ],
  dragonfly: [
    { at: [0, 0, 0], size: [0.09, 0.09, 0.8], color: 0, side: 0 },
    ...wings([0.3, 0.04, 0.12], [0.55, 0.03, 0.12], 1),
    ...wings([0.28, 0.04, -0.05], [0.5, 0.03, 0.11], 1),
  ],
}
/** Wing beats per second (radians), wing swing, and size relative to a 35-cell QR. */
const FLIGHT: Record<CreatureKind, { flap: number; swing: number; scale: number }> = {
  butterfly: { flap: 12, swing: 1, scale: 2 },
  bird: { flap: 5, swing: 0.6, scale: 2 },
  dragonfly: { flap: 40, swing: 0.3, scale: 1.8 },
}

/** Where a creature is at a moment, in grid units. */
function flightPoint(c: Creature, time: number): [number, number, number] {
  const t = time * c.speed + c.phase
  if (c.kind === 'bird')
    return [
      c.x + Math.cos(t) * c.range,
      c.y + Math.sin(time * 0.7 + c.phase) * 0.5,
      c.z + Math.sin(t) * c.range,
    ]
  return [
    c.x + Math.sin(t) * c.range,
    c.y + Math.sin(t * 2.3) * 0.5,
    c.z + Math.sin(t * 1.37 + 1) * c.range * 0.8,
  ]
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Draws a coloured voxel scene with an orthographic camera.
 * morph 0 = scenery (slow orbit from a corner), 1 = QR (straight down, full contrast).
 */
export class ScapeRenderer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new OrthographicCamera()
  private readonly geometry = shadedCube()
  private readonly material = new MeshBasicMaterial({ vertexColors: true })
  private readonly creatureGeometry = shadedCube()
  private readonly creatureMaterial = new MeshBasicMaterial({ vertexColors: true, transparent: true })
  private creatureMesh: InstancedMesh | null = null
  private creatures: readonly Creature[] = []
  private readonly uniforms = { uTime: { value: 0 }, uSway: { value: 1 } }
  private time = 0
  private mesh: InstancedMesh | null = null
  private voxels: ColoredVoxels | null = null
  private scenery: Float32Array = new Float32Array()
  private qr: Float32Array = new Float32Array()

  private azimuth = Math.PI / 4
  private morph = 0
  private morphTarget = 0
  private shownMorph = -1
  private frame = 0
  private last = 0
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

  /** pixelRatio is fixed for offscreen export canvases; on screen it follows the display (max 2). */
  constructor(
    private readonly canvas: HTMLCanvasElement,
    pixelRatio = Math.min(devicePixelRatio, 2),
  ) {
    // preserveDrawingBuffer so PNG export and screenshots can read the canvas.
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(pixelRatio)
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      shader.vertexShader = `attribute float motion;
uniform float uTime;
uniform float uSway;
${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 ip = instanceMatrix[3].xyz;
        float ph = uTime * 1.4 + ip.x * 0.35 + ip.z * 0.25 + ip.y * 0.2;
        if (motion > 0.5 && motion < 1.5) transformed.xz += vec2(sin(ph), cos(ph * 0.8)) * 0.06 * uSway * min(ip.y / 10.0, 1.5);
        else if (motion > 1.5) transformed.y += sin(ph * 1.3) * 0.08 * uSway;`,
      )
    }
  }

  setVoxels(voxels: ColoredVoxels): void {
    if (this.mesh) {
      this.scene.remove(this.mesh)
      this.mesh.dispose()
    }
    this.voxels = voxels
    const mesh = new InstancedMesh(this.geometry, this.material, voxels.count)
    const half = voxels.size / 2
    const dummy = new Object3D()
    for (let i = 0; i < voxels.count; i++) {
      const p = voxels.positions
      dummy.position.set(
        (p[i * 3] ?? 0) - half + 0.5,
        (p[i * 3 + 1] ?? 0) + 0.5,
        (p[i * 3 + 2] ?? 0) - half + 0.5,
      )
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    this.scenery = toLinear(voxels.sceneryColors)
    this.qr = toLinear(voxels.qrColors)
    this.geometry.setAttribute('motion', new InstancedBufferAttribute(Float32Array.from(voxels.motion), 1))
    mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(voxels.count * 3), 3)
    mesh.instanceColor.setUsage(DynamicDrawUsage)
    this.mesh = mesh
    this.shownMorph = -1
    this.scene.add(mesh)
    this.setCreatures(voxels.creatures)
  }

  private setCreatures(creatures: readonly Creature[]): void {
    if (this.creatureMesh) {
      this.scene.remove(this.creatureMesh)
      this.creatureMesh.dispose()
    }
    this.creatures = creatures
    const count = creatures.reduce((n, c) => n + PARTS[c.kind].length, 0)
    const mesh = new InstancedMesh(this.creatureGeometry, this.creatureMaterial, count)
    const color = new Color()
    let i = 0
    for (const c of creatures)
      for (const p of PARTS[c.kind]) mesh.setColorAt(i++, color.setHex(c.colors[p.color]))
    this.creatureMesh = mesh
    this.scene.add(mesh)
  }

  /** Moves every creature part to where it is at `time` (grid units shifted to the centred scene). */
  private placeCreatures(time: number, half: number): void {
    const mesh = this.creatureMesh
    if (!mesh) return
    const base = new Matrix4()
    const part = new Matrix4()
    const tmp = new Matrix4()
    let i = 0
    for (const c of this.creatures) {
      const now = flightPoint(c, time)
      const next = flightPoint(c, time + 0.05)
      const fly = FLIGHT[c.kind]
      const scale = fly.scale * Math.max(1, this.voxels ? this.voxels.size / 35 : 1)
      const flap = Math.sin(time * fly.flap + c.phase) * fly.swing
      base
        .makeTranslation(now[0] - half + 0.5, now[1] + 0.5, now[2] - half + 0.5)
        .multiply(tmp.makeRotationY(Math.atan2(next[0] - now[0], next[2] - now[2])))
        .multiply(tmp.makeScale(scale, scale, scale))
      for (const p of PARTS[c.kind]) {
        part
          .copy(base)
          .multiply(tmp.makeRotationZ(p.side * flap))
          .multiply(tmp.makeTranslation(p.at[0] * (p.side || 1), p.at[1], p.at[2]))
          .multiply(tmp.makeScale(...p.size))
        mesh.setMatrixAt(i++, part)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  /** Smoothly turn into the QR (true) or back into scenery (false). */
  showQr(on: boolean): void {
    this.morphTarget = on ? 1 : 0
  }

  get isQr(): boolean {
    return this.morph === 1
  }

  start(): void {
    if (this.frame) return
    this.last = performance.now()
    const tick = (now: number) => {
      this.frame = requestAnimationFrame(tick)
      this.step(Math.min((now - this.last) / 1000, 0.1))
      this.last = now
    }
    this.frame = requestAnimationFrame(tick)
  }

  stop(): void {
    cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  dispose(): void {
    this.stop()
    this.mesh?.dispose()
    this.creatureMesh?.dispose()
    this.geometry.dispose()
    this.material.dispose()
    this.creatureGeometry.dispose()
    this.creatureMaterial.dispose()
    this.renderer.dispose()
  }

  private step(dt: number): void {
    const dir = Math.sign(this.morphTarget - this.morph)
    this.morph = Math.min(1, Math.max(0, this.morph + (dir * dt) / MORPH_SECONDS))
    this.time += dt
    if (this.morph === 0 && !this.reducedMotion.matches) this.azimuth += dt * ORBIT_RADIANS_PER_SECOND
    this.render()
  }

  /** Draws one exact moment, for GIF export. */
  renderFrame(azimuth: number, morph: number, time: number): void {
    this.azimuth = azimuth
    this.morph = morph
    this.time = time
    this.render()
  }

  render(): void {
    const v = this.voxels
    if (!v || !this.mesh) return
    this.resize()
    // Reduce-motion is for the live page; exported files (offscreen canvas) keep the smooth morph and sway.
    const reduce = this.reducedMotion.matches && this.canvas.isConnected
    const e = reduce ? Math.round(this.morph) : ease(this.morph)
    // Motion fades out on the way to the QR so the code is perfectly still when scanned.
    this.uniforms.uTime.value = this.time
    this.uniforms.uSway.value = reduce ? 0 : 1 - e

    // Any quarter turn of a QR still scans, so snap to the nearest one instead of spinning back to 0.
    const quarter = Math.PI / 2
    const snapped = Math.round(this.azimuth / quarter) * quarter
    const az = this.azimuth + (snapped - this.azimuth) * e
    const el = SCENERY_ELEVATION + (QR_ELEVATION - SCENERY_ELEVATION) * e
    const r = v.size * 3
    const cy = (v.height * (1 - e)) / 3
    const cos = Math.cos(el)
    this.camera.position.set(r * cos * Math.sin(az), cy + r * Math.sin(el), r * cos * Math.cos(az))
    // "Up" on screen is the direction of rising elevation: never parallel to the view, even straight down.
    this.camera.up.set(-Math.sin(el) * Math.sin(az), cos, -Math.sin(el) * Math.cos(az))
    this.camera.lookAt(0, cy, 0)

    const aspect = this.width() / Math.max(1, this.height())
    const sceneryHalf = v.size * 0.68
    const qrHalf = v.size * 0.5
    const half = sceneryHalf + (qrHalf - sceneryHalf) * e
    const hx = aspect >= 1 ? half * aspect : half
    const hy = aspect >= 1 ? half : half / aspect
    Object.assign(this.camera, { left: -hx, right: hx, top: hy, bottom: -hy, near: 0.1, far: r * 4 })
    this.camera.updateProjectionMatrix()

    if (this.shownMorph !== e && this.mesh.instanceColor) {
      const out = this.mesh.instanceColor.array as Float32Array
      for (let i = 0; i < out.length; i++)
        out[i] = (this.scenery[i] ?? 0) + ((this.qr[i] ?? 0) - (this.scenery[i] ?? 0)) * e
      this.mesh.instanceColor.needsUpdate = true
      this.shownMorph = e
    }
    // Creatures leave early in the morph so the QR is clear, and come back as it turns into scenery.
    // With reduce-motion they stay where they are.
    const presence = Math.max(0, 1 - e * 2.5)
    if (this.creatureMesh) {
      this.creatureMesh.visible = presence > 0
      this.creatureMaterial.opacity = presence
      if (presence > 0) this.placeCreatures(reduce ? 0 : this.time, v.size / 2)
    }
    this.renderer.render(this.scene, this.camera)
  }

  // An offscreen canvas has no layout size, so it keeps the size it was created with.
  private width(): number {
    return this.canvas.isConnected
      ? this.canvas.clientWidth
      : this.canvas.width / this.renderer.getPixelRatio()
  }

  private height(): number {
    return this.canvas.isConnected
      ? this.canvas.clientHeight
      : this.canvas.height / this.renderer.getPixelRatio()
  }

  private resize(): void {
    const w = this.width()
    const h = this.height()
    const ratio = this.renderer.getPixelRatio()
    if (this.canvas.width !== Math.floor(w * ratio) || this.canvas.height !== Math.floor(h * ratio))
      this.renderer.setSize(w, h, false)
  }
}

/** sRGB hex colours to linear floats for three.js instance colours. */
function toLinear(hexes: Uint32Array): Float32Array {
  const out = new Float32Array(hexes.length * 3)
  const c = new Color()
  hexes.forEach((hex, i) => {
    c.setHex(hex)
    out[i * 3] = c.r
    out[i * 3 + 1] = c.g
    out[i * 3 + 2] = c.b
  })
  return out
}
