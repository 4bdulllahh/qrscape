import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from 'three'
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

  constructor(private readonly canvas: HTMLCanvasElement) {
    // preserveDrawingBuffer so PNG export and screenshots can read the canvas.
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
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
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
  }

  private step(dt: number): void {
    const dir = Math.sign(this.morphTarget - this.morph)
    this.morph = Math.min(1, Math.max(0, this.morph + (dir * dt) / MORPH_SECONDS))
    this.time += dt
    if (this.morph === 0 && !this.reducedMotion.matches) this.azimuth += dt * ORBIT_RADIANS_PER_SECOND
    this.render()
  }

  render(): void {
    const v = this.voxels
    if (!v || !this.mesh) return
    this.resize()
    const e = this.reducedMotion.matches ? Math.round(this.morph) : ease(this.morph)
    // Motion fades out on the way to the QR so the code is perfectly still when scanned.
    this.uniforms.uTime.value = this.time
    this.uniforms.uSway.value = this.reducedMotion.matches ? 0 : 1 - e

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

    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight)
    const sceneryHalf = v.size * 0.78
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
    this.renderer.render(this.scene, this.camera)
  }

  private resize(): void {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
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
