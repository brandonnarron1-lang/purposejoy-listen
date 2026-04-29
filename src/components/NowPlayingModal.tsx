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

  return (
    <>
      {/* Mobile: fullscreen */}
      <div
        className="fixed inset-0 z-[200] flex flex-col md:hidden"
        style={{ overflowY: 'auto' }}
      >
        {/* Blurred background */}
        {coverSrc && (
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: -1,
              backgroundImage: `url(${coverSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) brightness(0.35)',
              transform: 'scale(1.1)',
            }}
          />
        )}
        {!coverSrc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#0d1526' }} />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
          <ShareButton song={currentSong} compact />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(250,247,242,0.6)' }}
          >
            Now Playing
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(250,247,242,0.7)', fontSize: 22, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Cover art */}
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '80vw',
              aspectRatio: '1',
            }}
          >
            <ColorHalo imageSrc={coverSrc} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
              <CoverArt src={coverSrc} alt={currentSong.title} isPlaying={playing} size="large" />
              <AudioVisualizer analyserNode={analyserNode} isPlaying={playing} />
            </div>
          </div>
        </div>

        {/* Track info */}
        <div className="px-8 pb-3 flex-shrink-0">
          <h2
            className="text-2xl font-bold truncate"
            style={{ color: '#FAF7F2' }}
          >
            {currentSong.title}
          </h2>
          <p className="text-base mt-1" style={{ color: '#E8B14A' }}>
            {currentSong.artist}
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-8 pb-4 flex-shrink-0">
          <div
            className="relative w-full rounded-full cursor-pointer"
            style={{ height: 6, background: 'rgba(250,247,242,0.2)' }}
            onClick={e => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              seek(pct * duration)
            }}
          >
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: '#E8B14A' }}
            />
          </div>
          <div
            className="flex justify-between text-xs mt-2"
            style={{ color: 'rgba(250,247,242,0.5)' }}
          >
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-10 pb-8 flex-shrink-0">
          <button
            onClick={toggleShuffle}
            style={{
              width: 44, height: 44, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: shuffle ? 1 : 0.4, color: '#E8B14A',
            }}
          >
            ⇄
          </button>
          <button
            onClick={prev}
            style={{
              width: 64, height: 64, fontSize: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FAF7F2',
            }}
          >
            ⏮
          </button>
          <button
            onClick={togglePlay}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, background: '#E8B14A', color: '#1B2A4E',
              boxShadow: '0 4px 20px rgba(232,177,74,0.4)',
              flexShrink: 0,
            }}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            onClick={next}
            style={{
              width: 64, height: 64, fontSize: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FAF7F2',
            }}
          >
            ⏭
          </button>
          <button
            onClick={replay}
            style={{
              width: 44, height: 44, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(250,247,242,0.5)',
            }}
          >
            ↩
          </button>
        </div>

        {/* Lyrics panel */}
        {currentSong.lyrics && (
          <div
            className="mx-6 mb-8 rounded-2xl lyrics-fade flex-shrink-0"
            style={{
              maxHeight: '40vh',
              overflowY: 'auto',
              padding: '24px 20px',
              background: 'rgba(255,255,255,0.07)',
              lineHeight: 1.9,
              color: 'rgba(250,247,242,0.85)',
              fontSize: 15,
              whiteSpace: 'pre-wrap',
            }}
          >
            {currentSong.lyrics}
          </div>
        )}

        {/* Safe area */}
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)', flexShrink: 0 }} />
      </div>

      {/* Desktop: right-side drawer */}
      <div
        className="hidden md:flex fixed right-0 top-0 bottom-0 z-[200] flex-col"
        style={{
          width: 480,
          background: 'rgba(13, 21, 38, 0.96)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderLeft: '1px solid rgba(232,177,74,0.15)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.5)',
          overflowY: 'auto',
        }}
      >
        {/* Blurred bg for desktop drawer too */}
        {coverSrc && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${coverSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) brightness(0.2)',
              transform: 'scale(1.15)',
              zIndex: 0,
            }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-8 pb-4">
            <ShareButton song={currentSong} compact />
            <span className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(250,247,242,0.5)' }}>Now Playing</span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(250,247,242,0.7)', fontSize: 20, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              ✕
            </button>
          </div>

          {/* Cover */}
          <div className="px-8 pb-6">
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxHeight: 400 }}>
              <ColorHalo imageSrc={coverSrc} />
              <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
                <CoverArt src={coverSrc} alt={currentSong.title} isPlaying={playing} size="large" />
                <AudioVisualizer analyserNode={analyserNode} isPlaying={playing} />
              </div>
            </div>
          </div>

          {/* Track info */}
          <div className="px-8 pb-3">
            <h2 className="text-2xl font-bold truncate" style={{ color: '#FAF7F2' }}>{currentSong.title}</h2>
            <p className="text-base mt-1" style={{ color: '#E8B14A' }}>{currentSong.artist}</p>
          </div>

          {/* Progress */}
          <div className="px-8 pb-4">
            <div
              className="relative w-full rounded-full cursor-pointer"
              style={{ height: 6, background: 'rgba(250,247,242,0.2)' }}
              onClick={e => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const pct = (e.clientX - rect.left) / rect.width
                seek(pct * duration)
              }}
            >
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: '#E8B14A' }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: 'rgba(250,247,242,0.5)' }}>
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-10 pb-6">
            <button onClick={toggleShuffle} style={{ width: 44, height: 44, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: shuffle ? 1 : 0.4, color: '#E8B14A' }}>⇄</button>
            <button onClick={prev} style={{ width: 64, height: 64, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FAF7F2' }}>⏮</button>
            <button onClick={togglePlay} style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: '#E8B14A', color: '#1B2A4E', boxShadow: '0 4px 20px rgba(232,177,74,0.4)', flexShrink: 0 }}>{playing ? '⏸' : '▶'}</button>
            <button onClick={next} style={{ width: 64, height: 64, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FAF7F2' }}>⏭</button>
            <button onClick={replay} style={{ width: 44, height: 44, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(250,247,242,0.5)' }}>↩</button>
          </div>

          {/* Lyrics */}
          {currentSong.lyrics && (
            <div
              className="mx-6 mb-6 rounded-2xl lyrics-fade"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 20px',
                background: 'rgba(255,255,255,0.06)',
                lineHeight: 1.9,
                color: 'rgba(250,247,242,0.85)',
                fontSize: 15,
                whiteSpace: 'pre-wrap',
              }}
            >
              {currentSong.lyrics}
            </div>
          )}

          <div style={{ height: 32, flexShrink: 0 }} />
        </div>
      </div>
    </>
  )
}
