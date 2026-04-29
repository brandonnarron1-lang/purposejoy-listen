import { usePlayer } from '../context/PlayerContext'
import { ShareButton } from './ShareButton'
import { CoverArt } from './CoverArt'
import { ColorHalo } from './ColorHalo'
import { AudioVisualizer } from './AudioVisualizer'

function fmt(s: number) {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export function NowPlayingModal({ onClose }: { onClose: () => void }) {
  const {
    currentSong, playing, currentTime, duration, shuffle,
    togglePlay, next, prev, seek, toggleShuffle, replay,
    analyserNode,
  } = usePlayer()

  if (!currentSong) return null

  const coverSrc = currentSong.cover_r2_key
    ? `/api/cover/${currentSong.cover_r2_key}`
    : undefined

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const closeBtn = (
    <button
      onClick={onClose}
      aria-label="Close now playing"
      style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(250,247,242,0.7)', fontSize: 20, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        fontFamily: 'var(--font-head)',
      }}
    >
      ✕
    </button>
  )

  const controls = (dark = true) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
      <button
        onClick={toggleShuffle}
        style={{
          width: 44, height: 44, fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: shuffle ? 1 : 0.4,
          color: '#D4AF37',
        }}
      >
        ⇄
      </button>
      <button
        onClick={prev}
        style={{
          width: 64, height: 64, fontSize: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dark ? '#FAF7F2' : '#1B2A4E',
        }}
      >
        ⏮
      </button>
      <button
        onClick={togglePlay}
        className="pj-glow-gold"
        style={{
          width: 72, height: 72, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          background: 'linear-gradient(135deg, #FFD750 0%, #D4AF37 100%)',
          color: '#1B2A4E',
          flexShrink: 0,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
        }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <button
        onClick={next}
        style={{
          width: 64, height: 64, fontSize: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dark ? '#FAF7F2' : '#1B2A4E',
        }}
      >
        ⏭
      </button>
      <button
        onClick={replay}
        style={{
          width: 44, height: 44, fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dark ? 'rgba(250,247,242,0.45)' : 'var(--pj-muted)',
        }}
      >
        ↩
      </button>
    </div>
  )

  const progressBar = (
    <div style={{ padding: '0 32px 16px' }}>
      <div
        style={{ position: 'relative', width: '100%', height: 6, borderRadius: 3, background: 'rgba(250,247,242,0.2)', cursor: 'pointer' }}
        onClick={e => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          seek(((e.clientX - rect.left) / rect.width) * duration)
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 3,
            background: 'linear-gradient(90deg, #D4AF37, #FFD750)',
            width: `${progress}%`,
            transition: 'width 0.5s linear',
            boxShadow: '0 0 8px rgba(212,175,55,0.4)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 400, color: 'rgba(250,247,242,0.45)', letterSpacing: '0.08em' }}>
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>
    </div>
  )

  const trackInfo = (
    <div style={{ padding: '0 32px 8px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
          fontSize: 'clamp(1.3rem, 5vw, 1.6rem)',
          color: '#FAF7F2',
          margin: 0,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {currentSong.title}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 400,
          color: '#D4AF37',
          margin: '6px 0 0',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
        }}
      >
        {currentSong.artist}
      </p>
    </div>
  )

  const lyricsPanel = currentSong.lyrics ? (
    <div
      className="lyrics-fade"
      style={{
        margin: '0 24px 24px',
        borderRadius: 16,
        maxHeight: '40vh',
        overflowY: 'auto',
        padding: '24px 20px',
        background: 'rgba(255,255,255,0.06)',
        lineHeight: 2.0,
        color: 'rgba(250,247,242,0.82)',
        fontSize: 15,
        fontFamily: 'var(--font-body)',
        fontWeight: 300,
        whiteSpace: 'pre-wrap',
        letterSpacing: '0.02em',
      }}
    >
      {currentSong.lyrics}
    </div>
  ) : null

  return (
    <>
      {/* ── MOBILE: fullscreen with slide-up transition ── */}
      <div
        className="modal-slide-up"
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
        aria-label="Now playing"
        role="dialog"
      >
        {/* Blurred bg */}
        {coverSrc ? (
          <div
            aria-hidden="true"
            style={{
              position: 'fixed', inset: 0, zIndex: -1,
              backgroundImage: `url(${coverSrc})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(80px) brightness(0.3)',
              transform: 'scale(1.12)',
            }}
          />
        ) : (
          <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(160deg, #0A0500 0%, #1B2A4E 100%)' }} />
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 20px 16px', flexShrink: 0 }}>
          <ShareButton song={currentSong} compact />
          {/* Brand wordmark — center */}
          <img
            src="/brand/wordmark.png"
            alt="PurposeJoy"
            className="pj-wordmark-sm md:hidden"
            style={{ height: 20, width: 'auto', opacity: 0.75, filter: 'brightness(1.2)' }}
          />
          {closeBtn}
        </div>

        {/* Cover */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 32px 16px', minHeight: 0 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '80vw', aspectRatio: '1' }}>
            <ColorHalo imageSrc={coverSrc} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
              <CoverArt src={coverSrc} alt={currentSong.title} isPlaying={playing} size="large" />
              <AudioVisualizer analyserNode={analyserNode} isPlaying={playing} />
            </div>
          </div>
        </div>

        {trackInfo}
        {progressBar}

        {/* Controls */}
        <div style={{ paddingBottom: 8, flexShrink: 0 }}>
          {controls(true)}
        </div>

        {lyricsPanel}
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)', flexShrink: 0 }} />
      </div>

      {/* ── DESKTOP: right-side drawer with slide-in transition ── */}
      <div
        className="drawer-slide-in"
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 200,
          width: 480,
          display: 'none',
          flexDirection: 'column',
          background: 'rgba(10, 5, 0, 0.96)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderLeft: '1px solid var(--pj-gold-border)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
          overflowY: 'auto',
        }}
      >
        {coverSrc && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${coverSrc})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(80px) brightness(0.18)',
              transform: 'scale(1.15)',
            }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 24px 16px' }}>
            <ShareButton song={currentSong} compact />
            <img src="/brand/wordmark.png" alt="PurposeJoy" style={{ height: 22, width: 'auto', opacity: 0.7, filter: 'brightness(1.15)' }} />
            {closeBtn}
          </div>

          {/* Cover */}
          <div style={{ padding: '0 32px 24px' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxHeight: 400 }}>
              <ColorHalo imageSrc={coverSrc} />
              <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
                <CoverArt src={coverSrc} alt={currentSong.title} isPlaying={playing} size="large" />
                <AudioVisualizer analyserNode={analyserNode} isPlaying={playing} />
              </div>
            </div>
          </div>

          {trackInfo}
          {progressBar}

          <div style={{ paddingBottom: 8 }}>
            {controls(true)}
          </div>

          {lyricsPanel}
          <div style={{ height: 32, flexShrink: 0 }} />
        </div>
      </div>

      {/* Responsive toggle: hide mobile on md+, show desktop on md+ */}
      <style>{`
        @media (min-width: 768px) {
          .modal-slide-up { display: none !important; }
          .drawer-slide-in { display: flex !important; }
        }
      `}</style>
    </>
  )
}
