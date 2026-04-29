import { useState, useEffect } from 'react'
import { FastAverageColor } from 'fast-average-color'

const fac = new FastAverageColor()

interface ColorHaloProps {
  imageSrc?: string
}

export function ColorHalo({ imageSrc }: ColorHaloProps) {
  const [color, setColor] = useState('#1B2A4E')

  useEffect(() => {
    if (!imageSrc) {
      setColor('#1B2A4E')
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const result = fac.getColor(img, { algorithm: 'dominant', ignoredColor: [250, 247, 242, 255, 10] })
        if (!result.error) {
          setColor(result.hex)
        }
      } catch {
        setColor('#1B2A4E')
      }
    }
    img.onerror = () => setColor('#1B2A4E')
    img.src = imageSrc
  }, [imageSrc])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: '-20%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.4,
        filter: 'blur(40px)',
        transform: 'scale(1.5)',
        transition: 'background 300ms ease',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
