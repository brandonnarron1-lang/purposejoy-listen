import { useRef, useEffect } from 'react'

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null
  isPlaying: boolean
}

const BARS = 32
const BAR_COLOR = 'rgba(232, 177, 74, 0.65)'

export function AudioVisualizer({ analyserNode, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)

  const isLowPower =
    typeof navigator !== 'undefined' &&
    'hardwareConcurrency' in navigator &&
    navigator.hardwareConcurrency < 4

  const targetMs = isLowPower ? 1000 / 30 : 1000 / 60

  useEffect(() => {
    if (!analyserNode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const bufferLength = analyserNode.frequencyBinCount // fftSize/2 = 32
    const dataArray = new Uint8Array(bufferLength)

    const draw = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(draw)

      if (timestamp - lastFrameRef.current < targetMs) return
      lastFrameRef.current = timestamp

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      if (!isPlaying) return

      analyserNode.getByteFrequencyData(dataArray)

      const totalGap = W * 0.3
      const barWidth = (W - totalGap) / BARS
      const gap = totalGap / BARS
      const radius = Math.min(barWidth / 2, 3)

      ctx.fillStyle = BAR_COLOR

      for (let i = 0; i < BARS; i++) {
        const value = dataArray[i] ?? 0
        const barH = Math.max(2, (value / 255) * H * 0.9)
        const x = i * (barWidth + gap)
        const y = H - barH

        if (barH <= radius * 2) {
          ctx.beginPath()
          ctx.arc(x + barWidth / 2, H - radius, radius, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(x + radius, y)
          ctx.lineTo(x + barWidth - radius, y)
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
          ctx.lineTo(x + barWidth, H)
          ctx.lineTo(x, H)
          ctx.lineTo(x, y + radius)
          ctx.quadraticCurveTo(x, y, x + radius, y)
          ctx.closePath()
          ctx.fill()
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [analyserNode, isPlaying, targetMs])

  // Don't render if no analyser — graceful degradation
  if (!analyserNode) return null

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={48}
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '48px',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  )
}
