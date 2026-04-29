import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Playlist } from '../types'
import { usePlayer } from '../context/PlayerContext'
import { TrackRow } from '../components/TrackRow'

export function ListenHome() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { play, currentSong, playing, togglePlay } = usePlayer()

  useEffect(() => {
    fetch('/api/playlists/purposejoy')
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => setPlaylist(data))
      .catch(() => setError('Could not load playlist.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%', background: '#D4AF37',
              animation: `splash-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <p style={{ color: 'var(--pj-muted)', fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Loading
      </p>
      <style>{`
        @keyframes splash-dot-pulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1.0; }
        }
      `}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--pj-muted)', fontFamily: 'var(--font-body)' }}>{error}</p>
    </div>
  )

  const songs = playlist?.songs ?? []
  const hasCurrentSong = currentSong != null
  const firstSong = songs[0]

  function handlePrimaryPlay() {
    if (hasCurrentSong) { togglePlay() }
    else if (firstSong) { play(firstSong, songs) }
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 120 }}>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '72px 24px 48px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(27,42,78,0.12) 0%, var(--pj-bg) 100%)',
        }}
      >
        {/* Eyebrow */}
        <p className="pj-label" style={{ marginBottom: 12 }}>
          {playlist?.title ?? 'PurposeJoy'}
        </p>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: 'var(--font-head)',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 8vw, 3.2rem)',
            color: 'var(--pj-text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: '0 0 4px',
          }}
        >
          Live With Purpose
        </h1>

        {/* Gold accent line */}
        <p
          style={{
            fontFamily: 'var(--font-head)',
            fontWeight: 700,
            fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
            color: '#D4AF37',
            letterSpacing: '0.04em',
            textShadow: '0 0 20px rgba(212,175,55,0.3)',
            margin: 0,
          }}
        >
          And Joy.
        </p>

        {/* Italic tagline */}
        {playlist?.description && (
          <p
            style={{
              fontFamily: 'var(--font-accent)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '1.05rem',
              color: 'var(--pj-muted)',
              maxWidth: 440,
              margin: '16px auto 0',
              lineHeight: 1.6,
              letterSpacing: '0.02em',
            }}
          >
            {playlist.description}
          </p>
        )}

        {/* Primary play button */}
        {firstSong && (
          <button
            onClick={handlePrimaryPlay}
            style={{
              marginTop: 36,
              width: 80, height: 80,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: 'auto', marginRight: 'auto',
              fontSize: 28,
              background: 'linear-gradient(135deg, #FFD750 0%, #D4AF37 100%)',
              color: '#1B2A4E',
              boxShadow: '0 4px 24px rgba(212,175,55,0.4), 0 2px 8px rgba(0,0,0,0.15)',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 32px rgba(212,175,55,0.55), 0 2px 12px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(212,175,55,0.4), 0 2px 8px rgba(0,0,0,0.15)'
            }}
            aria-label={hasCurrentSong && playing ? 'Pause' : 'Play all'}
          >
            {hasCurrentSong && playing ? '⏸' : '▶'}
          </button>
        )}

        <p style={{ marginTop: 12, fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--pj-muted)' }}>
          {songs.length} {songs.length === 1 ? 'track' : 'tracks'} · Mike Eatmon
        </p>

        {/* Divider */}
        <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)', margin: '24px auto 0', borderRadius: 1 }} />
      </div>

      {/* Track list */}
      <div style={{ padding: '0 16px', maxWidth: 640, margin: '0 auto' }}>
        {songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🎵</p>
            <p style={{ color: 'var(--pj-muted)', fontFamily: 'var(--font-body)' }}>No tracks yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {songs.map((song, i) => (
              <div key={song.id} style={{ position: 'relative' }} className="group">
                <TrackRow song={song} queue={songs} index={i} />
                <Link
                  to={`/listen/${song.slug}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-head)',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--pj-secondary)',
                    background: 'rgba(27,42,78,0.07)',
                    padding: '4px 8px',
                    borderRadius: 4,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
