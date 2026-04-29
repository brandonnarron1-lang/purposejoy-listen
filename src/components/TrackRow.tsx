import { useRef, useEffect } from 'react'
import type { Song } from '../types'
import { usePlayer } from '../context/PlayerContext'

interface TrackRowProps {
  song: Song
  queue: Song[]
  index: number
}

function fmt(s?: number) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export function TrackRow({ song, queue, index }: TrackRowProps) {
  const { play, currentSong, playing } = usePlayer()
  const isActive = currentSong?.id === song.id
  const rowRef = useRef<HTMLDivElement>(null)

  // Smooth scroll-to-current on track change
  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isActive])

  const coverSrc = song.cover_r2_key ? `/api/cover/${song.cover_r2_key}` : undefined

  return (
    <div
      ref={rowRef}
      onClick={() => play(song, queue)}
      className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: isActive ? 'rgba(212,175,55,0.06)' : 'transparent',
        borderLeft: isActive ? '4px solid #D4AF37' : '4px solid transparent',
        boxShadow: isActive ? 'inset 0 0 24px rgba(212,175,55,0.04)' : 'none',
      }}
    >
      {/* Index / now-playing indicator */}
      <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
        {isActive && playing ? (
          <span style={{ fontSize: 12, color: '#D4AF37', animation: 'pulse 1.5s ease-in-out infinite' }}>▶</span>
        ) : (
          <span style={{ fontSize: 12, fontFamily: 'var(--font-head)', color: 'var(--pj-muted)', fontWeight: 400 }}>{index + 1}</span>
        )}
      </div>

      {/* Cover 64×64 with pulse on active */}
      <div
        style={{
          width: 64, height: 64, flexShrink: 0,
          borderRadius: 10, overflow: 'hidden', position: 'relative',
        }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            loading="lazy"
            className={isActive && playing ? 'cover-pulse' : ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--pj-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            ♪
          </div>
        )}
      </div>

      {/* Title / artist */}
      <div className="flex-1 min-w-0">
        {isActive && (
          <p className="pj-label" style={{ margin: '0 0 2px', fontSize: '0.6rem' }}>
            Now Playing
          </p>
        )}
        <p
          className="pj-track-title"
          style={{
            color: isActive ? '#D4AF37' : 'var(--pj-text)',
            fontSize: 14,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: isActive ? '0.01em' : '0',
          }}
        >
          {song.title}
        </p>
        <p style={{
          fontFamily: 'var(--font-head)',
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--pj-muted)',
          margin: '3px 0 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {song.artist}
        </p>
      </div>

      {/* Duration */}
      {song.duration_seconds && (
        <span style={{ fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 400, letterSpacing: '0.06em', color: 'var(--pj-muted)', flexShrink: 0 }}>
          {fmt(song.duration_seconds)}
        </span>
      )}
    </div>
  )
}
