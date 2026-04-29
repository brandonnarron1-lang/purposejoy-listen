import { useEffect, useRef, useState, useCallback } from 'react'
import type { Playlist, Song } from '../types'
import { usePlayer } from '../context/PlayerContext'
import { CoverArt } from '../components/CoverArt'
import { AudioVisualizer } from '../components/AudioVisualizer'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function fmtMin(s: number) {
  const m = Math.round(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`
}

// ─── Background atmosphere from cover color ───────────────────────────────────
function useDominantColor(src: string | undefined) {
  const [color, setColor] = useState<string>('27, 42, 78')
  useEffect(() => {
    if (!src) { setColor('27, 42, 78'); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = 8; c.height = 8
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0, 8, 8)
        const d = ctx.getImageData(0, 0, 8, 8).data
        let r = 0, g = 0, b = 0
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2] }
        const px = d.length / 4
        setColor(`${Math.round(r/px)}, ${Math.round(g/px)}, ${Math.round(b/px)}`)
      } catch { setColor('27, 42, 78') }
    }
    img.onerror = () => setColor('27, 42, 78')
    img.src = src
  }, [src])
  return color
}

// ─── Expandable Track Card ────────────────────────────────────────────────────
function TrackCard({
  song, queue, index, isActive, isPlaying,
}: {
  song: Song; queue: Song[]; index: number; isActive: boolean; isPlaying: boolean
}) {
  const { play, togglePlay } = usePlayer()
  const [expanded, setExpanded] = useState(false)
  const coverSrc = song.cover_r2_key ? `/api/cover/${song.cover_r2_key}` : undefined

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation()
    if (isActive) { togglePlay() } else { play(song, queue) }
  }

  function handleShare() {
    const url = `${window.location.origin}/listen/${song.slug}`
    if (navigator.share) {
      navigator.share({ title: song.title, text: `${song.title} by ${song.artist}`, url })
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'))
    }
  }

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: isActive
          ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(27,42,78,0.06) 100%)'
          : 'rgba(27,42,78,0.04)',
        border: isActive ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* ── Collapsed row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
        {/* Track number / active bars */}
        <div style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>
          {isActive && isPlaying ? (
            <span style={{ color: '#D4AF37', fontSize: 14 }}>▶</span>
          ) : (
            <span style={{ color: 'var(--pj-muted)', fontSize: 11, fontFamily: 'var(--font-head)' }}>
              {index + 1}
            </span>
          )}
        </div>

        {/* Cover thumbnail */}
        <div style={{ flexShrink: 0, borderRadius: 8, overflow: 'hidden', width: 48, height: 48, boxShadow: isActive ? '0 2px 12px rgba(212,175,55,0.3)' : '0 1px 4px rgba(0,0,0,0.12)' }}>
          <CoverArt src={coverSrc} alt={song.title} isPlaying={isActive && isPlaying} size="mini" isPulsing={isActive && isPlaying} />
        </div>

        {/* Title + artist */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-head)',
            fontWeight: isActive ? 700 : 600,
            fontSize: 14,
            color: isActive ? '#D4AF37' : 'var(--pj-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}>
            {song.title}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--pj-muted)', fontFamily: 'var(--font-head)', fontWeight: 500, letterSpacing: '0.06em' }}>
            {song.artist} · {fmt(song.duration_seconds ?? 0)}
          </p>
        </div>

        {/* Play button + expand chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handlePlay}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
              background: isActive
                ? 'linear-gradient(135deg, #FFD750, #D4AF37)'
                : 'rgba(27,42,78,0.1)',
              color: isActive ? '#1B2A4E' : 'var(--pj-text)',
              boxShadow: isActive ? '0 2px 8px rgba(212,175,55,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
            aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
          >
            {isActive && isPlaying ? '⏸' : '▶'}
          </button>

          <span style={{
            color: 'var(--pj-muted)', fontSize: 12,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}>▼</span>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div style={{
          padding: '0 14px 16px',
          borderTop: '1px solid rgba(212,175,55,0.12)',
          background: 'rgba(255,255,255,0.03)',
          animation: 'trackExpand 0.2s ease',
        }}>
          {song.description && (
            <p style={{
              margin: '12px 0 14px',
              fontSize: 13,
              color: 'var(--pj-muted)',
              fontFamily: 'var(--font-accent)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.6,
            }}>
              {song.description}
            </p>
          )}

          {/* Lyrics placeholder */}
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(27,42,78,0.05)',
            border: '1px solid rgba(212,175,55,0.1)',
            marginBottom: 14,
          }}>
            <p style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>
              Lyrics
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--pj-muted)', fontFamily: 'var(--font-body)' }}>
              {song.lyrics ?? 'Lyrics coming soon.'}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={e => { e.stopPropagation(); handleShare() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.35)',
                background: 'transparent', cursor: 'pointer', fontSize: 12,
                fontFamily: 'var(--font-head)', fontWeight: 600, color: '#D4AF37',
                letterSpacing: '0.05em',
              }}
            >
              ↑ Share
            </button>
            {song.download_enabled && (
              <a
                href={`/download/${song.slug}`}
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 20, border: '1px solid rgba(27,42,78,0.2)',
                  background: 'transparent', cursor: 'pointer', fontSize: 12,
                  fontFamily: 'var(--font-head)', fontWeight: 600, color: 'var(--pj-muted)',
                  letterSpacing: '0.05em', textDecoration: 'none',
                }}
              >
                ↓ Download
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({
  currentSong, playing, currentTime, duration, togglePlay, seek, next, prev, songs, analyserNode,
}: {
  currentSong: Song | null; playing: boolean; currentTime: number; duration: number
  togglePlay: () => void; seek: (t: number) => void; next: () => void; prev: () => void
  songs: Song[]; analyserNode: AnalyserNode | null
}) {
  const { play } = usePlayer()
  const displaySong = currentSong ?? songs[0] ?? null
  const coverSrc = displaySong?.cover_r2_key ? `/api/cover/${displaySong.cover_r2_key}` : undefined
  const dominantColor = useDominantColor(coverSrc)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const heroRef = useRef<HTMLDivElement>(null)

  function handleHeroPlay() {
    if (currentSong) { togglePlay() }
    else if (songs[0]) { play(songs[0], songs) }
  }

  function handleShare() {
    if (!displaySong) return
    const url = `${window.location.origin}/listen/${displaySong.slug}`
    if (navigator.share) {
      navigator.share({ title: displaySong.title, text: `${displaySong.title} by ${displaySong.artist}`, url })
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'))
    }
  }

  return (
    <div
      ref={heroRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'clamp(380px, 55vw, 520px)',
        background: `
          radial-gradient(ellipse 120% 80% at 50% 0%, rgba(${dominantColor},0.35) 0%, transparent 70%),
          linear-gradient(180deg, rgba(27,42,78,0.08) 0%, var(--pj-bg) 100%)
        `,
        transition: 'background 0.8s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px 40px',
        textAlign: 'center',
      }}
    >
      {/* Cover art */}
      {displaySong && (
        <div style={{
          position: 'relative',
          width: 'clamp(140px, 36vw, 200px)',
          height: 'clamp(140px, 36vw, 200px)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: `0 8px 40px rgba(${dominantColor},0.4), 0 4px 16px rgba(0,0,0,0.3)`,
          marginBottom: 20,
          flexShrink: 0,
          transition: 'box-shadow 0.8s ease',
        }}>
          <CoverArt src={coverSrc} alt={displaySong.title} isPlaying={playing} size="large" isPulsing={playing} />
        </div>
      )}

      {/* Visualizer */}
      {playing && analyserNode && (
        <div style={{ width: 'clamp(120px, 30vw, 180px)', height: 36, marginBottom: 8 }}>
          <AudioVisualizer analyserNode={analyserNode} isPlaying={playing} />
        </div>
      )}

      {/* Track info */}
      {displaySong ? (
        <>
          <h2 style={{
            margin: '0 0 4px',
            fontFamily: 'var(--font-head)',
            fontWeight: 900,
            fontSize: 'clamp(1.3rem, 5vw, 1.9rem)',
            color: currentSong ? '#D4AF37' : 'var(--pj-text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            transition: 'color 0.3s',
          }}>
            {displaySong.title}
          </h2>
          <p style={{
            margin: '0 0 20px',
            fontFamily: 'var(--font-head)',
            fontWeight: 500,
            fontSize: 13,
            color: 'var(--pj-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {displaySong.artist}
          </p>
        </>
      ) : (
        <h2 style={{
          margin: '0 0 20px',
          fontFamily: 'var(--font-head)',
          fontWeight: 900,
          fontSize: 'clamp(1.6rem, 6vw, 2.4rem)',
          color: 'var(--pj-text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          Live With Purpose<br />
          <span style={{ color: '#D4AF37', textShadow: '0 0 24px rgba(212,175,55,0.3)' }}>And Joy.</span>
        </h2>
      )}

      {/* Progress scrubber (only when a song is loaded) */}
      {currentSong && (
        <div style={{ width: '100%', maxWidth: 320, marginBottom: 20 }}>
          <input
            type="range" min={0} max={duration || 100} value={currentTime}
            onChange={e => seek(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#D4AF37' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--pj-muted)', fontFamily: 'var(--font-head)' }}>{fmt(currentTime)}</span>
            <span style={{ fontSize: 10, color: 'var(--pj-muted)', fontFamily: 'var(--font-head)' }}>{fmt(duration)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        {currentSong && (
          <button
            onClick={prev}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'rgba(27,42,78,0.45)', padding: 4 }}
            aria-label="Previous"
          >⏮</button>
        )}

        <button
          onClick={handleHeroPlay}
          className="pj-glow-gold"
          style={{
            width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            background: 'linear-gradient(135deg, #FFD750 0%, #D4AF37 100%)',
            color: '#1B2A4E',
            boxShadow: '0 4px 24px rgba(212,175,55,0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
          aria-label={currentSong && playing ? 'Pause' : 'Play'}
        >
          {currentSong && playing ? '⏸' : '▶'}
        </button>

        {currentSong && (
          <button
            onClick={next}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'rgba(27,42,78,0.45)', padding: 4 }}
            aria-label="Next"
          >⏭</button>
        )}
      </div>

      {/* Share button */}
      {displaySong && (
        <button
          onClick={handleShare}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
            borderRadius: 20, border: '1px solid rgba(212,175,55,0.35)',
            background: 'transparent', cursor: 'pointer', fontSize: 12,
            fontFamily: 'var(--font-head)', fontWeight: 600, color: '#D4AF37',
            letterSpacing: '0.05em',
          }}
        >
          ↑ Share this song
        </button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ListenHome() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const {
    currentSong, playing, currentTime, duration,
    togglePlay, seek, next, prev, analyserNode,
  } = usePlayer()

  useEffect(() => {
    fetch('/api/playlists/purposejoy')
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(setPlaylist)
      .catch(() => setError('Could not load playlist.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%', background: '#D4AF37',
            animation: `splash-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes splash-dot-pulse{0%,80%,100%{transform:scale(0.7);opacity:.4}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--pj-muted)', fontFamily: 'var(--font-body)' }}>{error}</p>
    </div>
  )

  const songs = playlist?.songs ?? []
  const totalSec = songs.reduce((a, s) => a + (s.duration_seconds ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <Hero
        currentSong={currentSong}
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        togglePlay={togglePlay}
        seek={seek}
        next={next}
        prev={prev}
        songs={songs}
        analyserNode={analyserNode}
      />

      {/* Catalog header */}
      <div style={{ padding: '24px 20px 12px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="pj-label">Catalog</p>
          <p style={{ fontSize: 11, color: 'var(--pj-muted)', fontFamily: 'var(--font-head)', fontWeight: 500 }}>
            {songs.length} {songs.length === 1 ? 'track' : 'tracks'} · {fmtMin(totalSec)}
          </p>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.4), transparent)', marginTop: 8 }} />
      </div>

      {/* Track cards */}
      <div style={{ padding: '0 12px', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {songs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '48px 0', color: 'var(--pj-muted)', fontFamily: 'var(--font-body)' }}>
            No tracks yet. Check back soon!
          </p>
        ) : (
          songs.map((song, i) => (
            <TrackCard
              key={song.id}
              song={song}
              queue={songs}
              index={i}
              isActive={currentSong?.id === song.id}
              isPlaying={playing && currentSong?.id === song.id}
            />
          ))
        )}
      </div>

      <style>{`
        @keyframes trackExpand {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
