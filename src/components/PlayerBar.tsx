import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { NowPlayingModal } from './NowPlayingModal'

function fmt(s: number) {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export function PlayerBar() {
  const { currentSong, playing, currentTime, duration, shuffle,
          togglePlay, next, prev, seek, toggleShuffle, replay } = usePlayer()
  const [expanded, setExpanded] = useState(false)

  if (!currentSong) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* Mobile: sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ background: 'var(--pj-surface)', borderTop: '1px solid rgba(124,58,237,0.3)' }}
      >
        {/* Progress bar */}
        <div className="relative h-1 w-full" style={{ background: 'rgba(124,58,237,0.2)' }}>
          <div className="h-1 transition-all" style={{ width: `${progress}%`, background: 'var(--pj-primary)' }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3" onClick={() => setExpanded(true)}>
          {currentSong.cover_r2_key ? (
            <img src={`/api/cover/${currentSong.cover_r2_key}`} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center text-lg"
              style={{ background: 'var(--pj-primary)' }}>♪</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--pj-text)' }}>{currentSong.title}</p>
            <p className="text-xs truncate" style={{ color: 'var(--pj-muted)' }}>{currentSong.artist}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); togglePlay() }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--pj-primary)' }}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={e => { e.stopPropagation(); next() }} className="text-xl" style={{ color: 'var(--pj-muted)' }}>⏭</button>
        </div>
      </div>

      {/* Desktop: full bottom bar */}
      <div
        className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 items-center gap-6 px-8"
        style={{ height: '80px', background: 'var(--pj-surface)', borderTop: '1px solid rgba(124,58,237,0.3)' }}
      >
        {/* Song info */}
        <div className="flex items-center gap-3 w-64 flex-shrink-0">
          {currentSong.cover_r2_key ? (
            <img src={`/api/cover/${currentSong.cover_r2_key}`} alt="" className="w-12 h-12 rounded object-cover" />
          ) : (
            <div className="w-12 h-12 rounded flex items-center justify-center text-xl"
              style={{ background: 'var(--pj-primary)' }}>♪</div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{currentSong.title}</p>
            <p className="text-xs truncate" style={{ color: 'var(--pj-muted)' }}>{currentSong.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button onClick={toggleShuffle} title="Shuffle"
              className="text-lg transition-opacity" style={{ opacity: shuffle ? 1 : 0.4, color: 'var(--pj-secondary)' }}>⇄</button>
            <button onClick={prev} className="text-xl" style={{ color: 'var(--pj-text)' }}>⏮</button>
            <button onClick={togglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: 'var(--pj-primary)' }}>
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={next} className="text-xl" style={{ color: 'var(--pj-text)' }}>⏭</button>
            <button onClick={replay} title="Replay" className="text-lg" style={{ color: 'var(--pj-muted)' }}>↩</button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs w-10 text-right" style={{ color: 'var(--pj-muted)' }}>{fmt(currentTime)}</span>
            <input type="range" min={0} max={duration || 100} value={currentTime}
              onChange={e => seek(Number(e.target.value))} className="flex-1" />
            <span className="text-xs w-10" style={{ color: 'var(--pj-muted)' }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="w-32 flex-shrink-0 flex items-center gap-2">
          <span style={{ color: 'var(--pj-muted)' }}>🔊</span>
          <input type="range" min={0} max={1} step={0.02}
            defaultValue={1} onChange={e => usePlayer().setVolume(Number(e.target.value))} className="flex-1" />
        </div>
      </div>

      {/* Mobile expanded now-playing */}
      {expanded && <NowPlayingModal onClose={() => setExpanded(false)} />}
    </>
  )
}
