import type { Song } from '../types'
import { usePlayer } from '../context/PlayerContext'

interface TrackRowProps {
  song: Song
  queue: Song[]
  index: number
}

export function TrackRow({ song, queue, index }: TrackRowProps) {
  const { play, currentSong, playing } = usePlayer()
  const isActive = currentSong?.id === song.id

  function fmt(s?: number) {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div
      onClick={() => play(song, queue)}
      className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: isActive ? 'rgba(27,42,78,0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(27,42,78,0.2)' : '1px solid transparent',
      }}
    >
      {/* Index / playing indicator */}
      <div className="w-6 text-center flex-shrink-0">
        {isActive && playing
          ? <span className="text-sm animate-pulse" style={{ color: 'var(--pj-primary)' }}>▶</span>
          : <span className="text-sm" style={{ color: 'var(--pj-muted)' }}>{index + 1}</span>
        }
      </div>

      {/* Cover art */}
      {song.cover_r2_key ? (
        <img src={`/api/cover/${song.cover_r2_key}`} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--pj-surface)' }}>♪</div>
      )}

      {/* Title / artist */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate"
          style={{ color: isActive ? 'var(--pj-secondary)' : 'var(--pj-text)' }}>{song.title}</p>
        <p className="text-xs truncate" style={{ color: 'var(--pj-muted)' }}>{song.artist}</p>
      </div>

      {/* Duration */}
      {song.duration_seconds && (
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--pj-muted)' }}>{fmt(song.duration_seconds)}</span>
      )}
    </div>
  )
}
