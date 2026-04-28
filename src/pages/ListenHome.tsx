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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-spin">⊙</div>
        <p style={{ color: 'var(--pj-muted)' }}>Loading...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ color: 'var(--pj-muted)' }}>{error}</p>
    </div>
  )

  const songs = playlist?.songs ?? []
  const hasCurrentSong = currentSong != null
  const firstSong = songs[0]

  function handlePrimaryPlay() {
    if (hasCurrentSong) {
      togglePlay()
    } else if (firstSong) {
      play(firstSong, songs)
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Hero */}
      <div className="relative overflow-hidden px-6 pt-16 pb-12 text-center"
        style={{ background: 'linear-gradient(180deg, rgba(27,42,78,0.15) 0%, var(--pj-bg) 100%)' }}>
        <div className="mb-2 text-xs tracking-widest uppercase" style={{ color: 'var(--pj-secondary)' }}>
          {playlist?.title ?? 'PurposeJoy'}
        </div>
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: 'var(--pj-text)' }}>
          Live With Purpose
        </h1>
        <p className="text-xl mb-1 font-semibold" style={{ color: 'var(--pj-secondary)' }}>And Joy.</p>
        {playlist?.description && (
          <p className="text-sm mt-3 max-w-md mx-auto" style={{ color: 'var(--pj-muted)' }}>{playlist.description}</p>
        )}

        {/* Primary play button */}
        {firstSong && (
          <button
            onClick={handlePrimaryPlay}
            className="mt-8 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-lg transition-transform hover:scale-105"
            style={{ background: 'var(--pj-primary)' }}
          >
            {hasCurrentSong && playing ? '⏸' : '▶'}
          </button>
        )}
        <p className="mt-3 text-xs" style={{ color: 'var(--pj-muted)' }}>
          {songs.length} {songs.length === 1 ? 'track' : 'tracks'}
        </p>
      </div>

      {/* Track list */}
      <div className="px-4 max-w-2xl mx-auto">
        {songs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎵</p>
            <p style={{ color: 'var(--pj-muted)' }}>No tracks yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, i) => (
              <div key={song.id} className="group relative">
                <TrackRow song={song} queue={songs} index={i} />
                <Link
                  to={`/listen/${song.slug}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded"
                  style={{ color: 'var(--pj-secondary)', background: 'rgba(27,42,78,0.08)' }}
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
