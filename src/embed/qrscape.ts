import { parseReroll, parseSize } from '../domain/embedCode'
import { makeWorld } from '../domain/world'
import { ScapeRenderer } from '../scene/renderer'

/** The loop people see on a website: scenery, then the QR so they notice it is one. */
const SCENERY_MS = 5000
const QR_MS = 2500

/**
 * <qr-scape link="..." scene="tree" palette="day" reroll="0" size="300"></qr-scape>
 * Self-contained: no React, no site CSS. Runs only while on screen.
 */
class QrScapeElement extends HTMLElement {
  static observedAttributes = ['link', 'scene', 'palette', 'reroll', 'size']

  private renderer: ScapeRenderer | null = null
  private canvas: HTMLCanvasElement | null = null
  private message: HTMLParagraphElement | null = null
  private observer: IntersectionObserver | null = null
  private timer = 0
  private loopQr = false
  private hovered = false
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

  connectedCallback(): void {
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    root.innerHTML = `<style>
      :host { display: inline-block; vertical-align: middle; }
      canvas:not([hidden]) { display: block; width: 100%; height: 100%; }
      p { margin: 0; font: 13px system-ui, sans-serif; color: #6f665a; }
    </style>`
    this.canvas = document.createElement('canvas')
    this.canvas.setAttribute('role', 'img')
    this.canvas.addEventListener('pointerenter', () => this.setHover(true))
    this.canvas.addEventListener('pointerleave', () => this.setHover(false))
    this.message = document.createElement('p')
    root.append(this.canvas, this.message)
    this.renderer = new ScapeRenderer(this.canvas)
    this.observer = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? this.play() : this.pause()),
      {
        threshold: 0.4,
      },
    )
    this.observer.observe(this)
    this.build()
  }

  disconnectedCallback(): void {
    this.pause()
    this.observer?.disconnect()
    this.renderer?.dispose()
    this.renderer = null
  }

  attributeChangedCallback(): void {
    if (this.renderer) this.build()
  }

  private build(): void {
    const size = parseSize(this.getAttribute('size'))
    this.style.width = `${size}px`
    this.style.height = `${size}px`
    const link = this.getAttribute('link') ?? ''
    const result = makeWorld(link, {
      reroll: parseReroll(this.getAttribute('reroll')),
      scene: this.getAttribute('scene') ?? undefined,
      palette: this.getAttribute('palette') ?? undefined,
    })
    if (!result.ok) {
      const message =
        result.reason === 'empty'
          ? 'QRscape: add a link, for example <qr-scape link="https://example.com">.'
          : 'QRscape: this link is too long for a QR code.'
      console.error(message)
      if (this.canvas) this.canvas.hidden = true
      if (this.message) this.message.textContent = message
      return
    }
    if (this.canvas) this.canvas.hidden = false
    if (this.message) this.message.textContent = ''
    this.canvas?.setAttribute('aria-label', `QR code for ${link.trim()}, drawn as a small 3D world`)
    this.renderer?.setVoxels(result.world.voxels)
    this.renderer?.render()
  }

  /** On screen: show the QR first so people notice, then loop scenery and QR. */
  private play(): void {
    if (!this.renderer) return
    this.renderer.start()
    if (this.reducedMotion.matches) return
    window.clearTimeout(this.timer)
    const phase = (qr: boolean) => {
      this.loopQr = qr
      this.apply()
      this.timer = window.setTimeout(() => phase(!qr), qr ? QR_MS : SCENERY_MS)
    }
    phase(true)
  }

  private pause(): void {
    window.clearTimeout(this.timer)
    this.renderer?.stop()
  }

  private setHover(on: boolean): void {
    this.hovered = on
    this.apply()
  }

  private apply(): void {
    this.renderer?.showQr(this.hovered || this.loopQr)
  }
}

if (!customElements.get('qr-scape')) customElements.define('qr-scape', QrScapeElement)
