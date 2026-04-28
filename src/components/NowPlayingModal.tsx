import { usePlayer } from '../context/PlayerContext'
import { ShareButton } from './ShareButton'

function fmt(s: number) {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export function NowPlayingModal({ onClose }: { onClose: () => void }) {
  const { currentSong, playing, currentTime, duration, shuffle,
          togglePlay, next, prev, seek, toggleShuffle, replay } = usePlayer()
  if (!currentSong) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'var(--pj-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-10 pb-4">
        <button onClick={onClose} className="text-2xl" style={{ color: 'var(--pj-muted)' }}>⌄</button>
        <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'var(--pj-muted)' }}>Now Playing</span>
        <ShareButton song={currentSong} compact />
      </div>

      {/* Artwork */}
      <div className="flex-1 flex items-center justify-center px-10">
        {currentSong.cover_r2_key ? (
          <img src={`/api/cover/${currentSong.cover_r2_key}`} alt={currentSong.title}
            className="w-full max-w-xs aspect-square rounded-2xl shadow-2xl object-cover" />
        ) : (
          <div className="w-full max-w-xs aspect-square rounded-2xl flex items-center justify-center text-8xl"
            style={{ background: 'var(--pj-surface)' }}>♪</div>
        )}
      </div>

      {/* Song info */}
      <div className="px-8 py-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--pj-text)' }}>{currentSong.title}</h2>
        <p className="text-base" style={{ color: 'var(--pj-muted)' }}>{currentSong.artist}</p>
      </div>

      {/* Seek */}
      <div className="px-8 pb-2">
        <input type="range" min={0} max={duration || 100} value={currentTime}
          onChange={e => seek(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--pj-muted)' }}>
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-10 py-6">
        <button onClick={toggleShuffle}
          className="text-2xl" style={{ opacity: shuffle ? 1 : 0.4, color: 'var(--pj-secondary)' }}>⇄</button>
        <button onClick={prev} className="text-3xl" style={{ color: 'var(--pj-text)' }}>⏮</button>
        <button onClick={togglePlay}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ background: 'var(--pj-primary)' }}>
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={next} className="text-3xl" style={{ color: 'var(--pj-text)' }}>⏭</button>
        <button onClick={replay} className="text-2xl" style={{ color: 'var(--pj-muted)' }}>↩</button>
      </div>

      {/* Bottom safe area */}
      <div className="h-8" />
    </div>
  )
}
