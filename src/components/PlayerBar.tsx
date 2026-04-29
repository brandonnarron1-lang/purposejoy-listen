import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { NowPlayingModal } from './NowPlayingModal'
import { CoverArt } from './CoverArt'

function fmt(s: number) {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function MarqueeTitle({ title, playing }: { title: string; playing: boolean }) {
  // Only scroll if title is likely to overflow (> ~28 chars is a rough heuristic)
  const shouldScroll = title.length > 28

  if (!shouldScroll) {
    return (
      <p className="text-sm font-semibold truncate" style={{ color: '#FAF7F2' }}>
        {title}
      </p>
    )
  }

  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <p
        className={playing ? 'marquee-content' : ''}
        style={{ color: '#FAF7F2', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
      >
        {title}
        {playing && <span style={{ paddingLeft: 40 }}>{title}</span>}
      </p>
    </div>
  )
}

export function PlayerBar() {
  const {
    currentSong, playing, currentTime, duration, shuffle,
    togglePlay, next, prev, seek, toggleShuffle, replay, setVolume,
  } = usePlayer()
  const [expanded, setExpanded] = useState(false)

  if (!currentSong) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const coverSrc = currentSong.cover_r2_key
    ? `/api/cover/${currentSong.cover_r2_key}`
    : undefined

  const barStyle = {
    background: 'rgba(27, 42, 78, 0.88)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    borderTop: '1px solid rgba(232,177,74,0.25)',
  }

  return (
    <>
      {/* Mobile: 56px sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={barStyle}
      >
        {/* 3px progress line */}
        <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#E8B14A', transition: 'width 0.5s linear' }} />
        </div>

        <div
          className="flex items-center gap-3 px-4"
          style={{ height: 56, cursor: 'pointer' }}
          onClick={() => setExpanded(true)}
        >
          {/* Mini cover with pulse */}
          <div style={{ flexShrink: 0 }}>
            <CoverArt
              src={coverSrc}
              alt=""
              isPlaying={playing}
              size="mini"
              isPulsing={playing}
            />
          </div>

          {/* Title + artist */}
          <div className="flex-1 min-w-0">
            <MarqueeTitle title={currentSong.title} playing={playing} />
            <p className="text-xs truncate" style={{ color: 'rgba(250,247,242,0.55)' }}>
              {currentSong.artist}
            </p>
          </div>

          {/* Play/pause */}
          <button
            onClick={e => { e.stopPropagation(); togglePlay() }}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#E8B14A', color: '#1B2A4E', fontSize: 16,
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); next() }}
            style={{ color: 'rgba(250,247,242,0.6)', fontSize: 20, padding: '0 4px' }}
            aria-label="Next track"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Desktop: 80px fixed bottom bar */}
      <div
        className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 items-center gap-6 px-8"
        style={{ ...barStyle, height: 80 }}
      >
        {/* Progress line along top edge */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#E8B14A', transition: 'width 0.5s linear' }} />
        </div>

        {/* Song info — clickable to open modal */}
        <div
          className="flex items-center gap-3 flex-shrink-0 cursor-pointer"
          style={{ width: 280 }}
          onClick={() => setExpanded(true)}
        >
          <CoverArt
            src={coverSrc}
            alt=""
            isPlaying={playing}
            size="mini"
            isPulsing={playing}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#FAF7F2' }}>
              {currentSong.title}
            </p>
            <p className="text-xs truncate" style={{ color: 'rgba(250,247,242,0.5)' }}>
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Center controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button onClick={toggleShuffle} title="Shuffle"
              style={{ fontSize: 18, opacity: shuffle ? 1 : 0.4, color: '#E8B14A' }}>⇄</button>
            <button onClick={prev} style={{ fontSize: 22, color: '#FAF7F2' }}>⏮</button>
            <button
              onClick={togglePlay}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, background: '#E8B14A', color: '#1B2A4E',
                boxShadow: '0 2px 12px rgba(232,177,74,0.35)',
              }}
            >
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={next} style={{ fontSize: 22, color: '#FAF7F2' }}>⏭</button>
            <button onClick={replay} title="Replay"
              style={{ fontSize: 18, color: 'rgba(250,247,242,0.45)' }}>↩</button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs w-10 text-right" style={{ color: 'rgba(250,247,242,0.45)' }}>
              {fmt(currentTime)}
            </span>
            <input
              type="range" min={0} max={duration || 100} value={currentTime}
              onChange={e => seek(Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#E8B14A' }}
            />
            <span className="text-xs w-10" style={{ color: 'rgba(250,247,242,0.45)' }}>
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="w-32 flex-shrink-0 flex items-center gap-2">
          <span style={{ color: 'rgba(250,247,242,0.5)' }}>🔊</span>
          <input
            type="range" min={0} max={1} step={0.02} defaultValue={1}
            onChange={e => setVolume(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: '#E8B14A' }}
          />
        </div>
      </div>

      {/* Now playing modal */}
      {expanded && <NowPlayingModal onClose={() => setExpanded(false)} />}
    </>
  )
}
