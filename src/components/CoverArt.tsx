interface CoverArtProps {
  src?: string
  alt?: string
  isPlaying?: boolean
  size?: 'mini' | 'medium' | 'large'
  className?: string
  isPulsing?: boolean
}

const sizeMap = {
  mini: 'w-12 h-12',
  medium: 'w-24 h-24',
  large: 'w-full',
}

export function CoverArt({ src, alt = '', isPlaying = false, size = 'large', className = '', isPulsing = false }: CoverArtProps) {
  const isAnimated = size === 'large' || size === 'medium'

  const containerClass = [
    sizeMap[size],
    'relative overflow-hidden rounded-xl flex-shrink-0',
    isPulsing ? 'cover-pulse' : '',
    className,
  ].filter(Boolean).join(' ')

  const imgClass = [
    'w-full h-full object-cover',
    isAnimated ? 'cover-kenburns' : '',
    isAnimated && !isPlaying ? 'paused' : '',
  ].filter(Boolean).join(' ')

  if (!src) {
    return (
      <div className={containerClass} style={{ background: 'var(--pj-primary)', aspectRatio: '1' }}>
        <span className="absolute inset-0 flex items-center justify-center text-3xl text-white opacity-60">♪</span>
      </div>
    )
  }

  return (
    <div className={containerClass} style={{ aspectRatio: '1' }}>
      <img
        src={src}
        alt={alt}
        className={imgClass}
        loading={size === 'large' ? 'eager' : 'lazy'}
        crossOrigin="anonymous"
      />
    </div>
  )
}
