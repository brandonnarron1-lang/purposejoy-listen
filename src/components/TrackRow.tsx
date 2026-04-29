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

  // Smooth scroll to current track when it changes
  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isActive])

  const coverSrc = song.cover_r2_key
    ? `/api/cover/${song.cover_r2_key}`
    : undefined

  return (
    <div
      ref={rowRef}
      onClick={() => play(song, queue)}
      className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: isActive ? 'rgba(27,42,78,0.06)' : 'transparent',
        borderLeft: isActive ? '4px solid #E8B14A' : '4px solid transparent',
        marginLeft: isActive ? 0 : 0,
      }}
    >
      {/* Index / playing indicator */}
      <div className="w-6 text-center flex-shrink-0">
        {isActive && playing ? (
          <span className="text-sm animate-pulse" style={{ color: '#E8B14A' }}>▶</span>
        ) : (
          <span className="text-sm" style={{ color: 'var(--pj-muted)' }}>{index + 1}</span>
        )}
      </div>

      {/* Cover art 96×96 */}
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden"
        style={{
          width: 64,
          height: 64,
          position: 'relative',
        }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            loading="lazy"
            className={isActive && playing ? 'cover-pulse' : ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--pj-surface)', fontSize: 24,
            }}
          >
            ♪
          </div>
        )}
      </div>

      {/* Title / artist */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: isActive ? '#E8B14A' : 'var(--pj-text)' }}
        >
          {song.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--pj-muted)' }}>
          {song.artist}
        </p>
      </div>

      {/* Duration */}
      {song.duration_seconds && (
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--pj-muted)' }}>
          {fmt(song.duration_seconds)}
        </span>
      )}
    </div>
  )
}
