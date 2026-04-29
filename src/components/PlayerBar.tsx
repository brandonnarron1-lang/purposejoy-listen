import { usePlayer } from '../context/PlayerContext'
import { CoverArt } from './CoverArt'

function fmt(s: number) {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function MarqueeTitle({ title, playing }: { title: string; playing: boolean }) {
  const shouldScroll = title.length > 26
  if (!shouldScroll) return (
    <p className="pj-track-title" style={{ color: '#FAF7F2', fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {title}
    </p>
  )
  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <p
        className={playing ? 'marquee-content' : ''}
        style={{ color: '#FAF7F2', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 600, whiteSpace: 'nowrap', margin: 0 }}
      >
        {title}{playing && <span style={{ paddingLeft: 40 }}>{title}</span>}
      </p>
    </div>
  )
}

export function PlayerBar() {
  const {
    currentSong, playing, currentTime, duration, shuffle,
    togglePlay, next, prev, seek, toggleShuffle, replay, setVolume,
  } = usePlayer()

  if (!currentSong) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const coverSrc = currentSong.cover_r2_key ? `/api/cover/${currentSong.cover_r2_key}` : undefined

  const barBase = {
    background: 'rgba(27, 42, 78, 0.92)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    borderTop: '1px solid var(--pj-gold-border)',
  } as React.CSSProperties

  const playBtnStyle = {
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15,
    background: 'linear-gradient(135deg, #FFD750 0%, #D4AF37 100%)',
    color: '#1B2A4E',
    boxShadow: '0 2px 10px rgba(212,175,55,0.35)',
    fontFamily: 'var(--font-head)', fontWeight: 700,
    border: 'none', cursor: 'pointer',
  } as React.CSSProperties

  return (
    <>
      {/* ── MOBILE: compact transport bar (no modal) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={barBase}>
        {/* Gold progress line */}
        <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #D4AF37, #FFD750)',
            boxShadow: '0 0 6px rgba(212,175,55,0.5)',
            transition: 'width 0.5s linear',
          }} />
        </div>
        <div className="flex items-center gap-3 px-4" style={{ height: 56 }}>
          <div style={{ flexShrink: 0 }}>
            <CoverArt src={coverSrc} alt="" isPlaying={playing} size="mini" isPulsing={playing} />
          </div>
          <div className="flex-1 min-w-0">
            <MarqueeTitle title={currentSong.title} playing={playing} />
            <p style={{ color: 'rgba(250,247,242,0.5)', fontSize: 11, margin: 0, fontFamily: 'var(--font-head)', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentSong.artist}
            </p>
          </div>
          <button onClick={prev} style={{ color: 'rgba(250,247,242,0.55)', fontSize: 18, padding: '0 2px', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Prev">⏮</button>
          <button onClick={e => { e.stopPropagation(); togglePlay() }} style={playBtnStyle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={next} style={{ color: 'rgba(250,247,242,0.55)', fontSize: 18, padding: '0 2px', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Next">⏭</button>
        </div>
      </div>

      {/* ── DESKTOP: full-width bar ── */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 items-center gap-6 px-8" style={{ ...barBase, height: 80 }}>
        {/* Gold progress line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #D4AF37, #FFD750)',
            boxShadow: '0 0 6px rgba(212,175,55,0.5)',
            transition: 'width 0.5s linear',
          }} />
        </div>

        {/* Song info */}
        <div className="flex items-center gap-3 flex-shrink-0" style={{ width: 280 }}>
          <CoverArt src={coverSrc} alt="" isPlaying={playing} size="mini" isPulsing={playing} />
          <div className="min-w-0">
            <p className="pj-track-title" style={{ color: '#FAF7F2', fontSize: 13, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentSong.title}
            </p>
            <p style={{ color: 'rgba(250,247,242,0.45)', fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Center controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button onClick={toggleShuffle} style={{ fontSize: 18, opacity: shuffle ? 1 : 0.4, color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}>⇄</button>
            <button onClick={prev} style={{ fontSize: 22, color: '#FAF7F2', background: 'none', border: 'none', cursor: 'pointer' }}>⏮</button>
            <button onClick={togglePlay} style={{ ...playBtnStyle, width: 44, height: 44, fontSize: 18 }} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={next} style={{ fontSize: 22, color: '#FAF7F2', background: 'none', border: 'none', cursor: 'pointer' }}>⏭</button>
            <button onClick={replay} style={{ fontSize: 18, color: 'rgba(250,247,242,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>↩</button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span style={{ color: 'rgba(250,247,242,0.4)', fontSize: 11, fontFamily: 'var(--font-head)', width: 40, textAlign: 'right', letterSpacing: '0.05em' }}>{fmt(currentTime)}</span>
            <input type="range" min={0} max={duration || 100} value={currentTime} onChange={e => seek(Number(e.target.value))} className="flex-1" />
            <span style={{ color: 'rgba(250,247,242,0.4)', fontSize: 11, fontFamily: 'var(--font-head)', width: 40, letterSpacing: '0.05em' }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="w-32 flex-shrink-0 flex items-center gap-2">
          <span style={{ color: 'rgba(250,247,242,0.45)', fontSize: 14 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.02} defaultValue={1} onChange={e => setVolume(Number(e.target.value))} className="flex-1" />
        </div>
      </div>
    </>
  )
}
