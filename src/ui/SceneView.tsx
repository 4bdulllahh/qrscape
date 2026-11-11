import { useEffect, useRef } from 'react'
import type { ColoredVoxels } from '../domain/voxels'
import { ScapeRenderer } from '../scene/renderer'
import { t } from './strings'

interface Props {
  voxels: ColoredVoxels
  showQr: boolean
}

/** The 3D view. Hover or focus it to see the QR. */
export function SceneView({ voxels, showQr }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ScapeRenderer | null>(null)
  const hoverRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = new ScapeRenderer(canvas)
    rendererRef.current = r
    r.start()
    return () => {
      r.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    rendererRef.current?.setVoxels(voxels)
  }, [voxels])

  useEffect(() => {
    rendererRef.current?.showQr(showQr || hoverRef.current)
  }, [showQr])

  const hover = (on: boolean) => {
    hoverRef.current = on
    rendererRef.current?.showQr(on || showQr)
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={t('sceneLabel')}
      tabIndex={0}
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => hover(false)}
      onFocus={() => hover(true)}
      onBlur={() => hover(false)}
      className="rounded-panel focus-visible:outline-accent aspect-square w-full max-w-[560px] touch-pan-y focus-visible:outline-2"
    />
  )
}
