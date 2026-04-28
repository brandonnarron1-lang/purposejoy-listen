import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Playlist } from '../types'
import { usePlayer } from '../context/PlayerContext'
import { TrackRow } from '../components/TrackRow'

export function PlaylistDetail() {
  const { playlistSlug } = useParams<{ playlistSlug: string }>()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const { play, playing, currentSong, togglePlay } = usePlayer()

  useEffect(() => {
    if (!playlistSlug) return
    fetch(`/api/playlists/${playlistSlug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPlaylist)
      .catch(() => setPlaylist(null))
      .finally(() => setLoading(false))
  }, [playlistSlug])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><span style={{ color: 'var(--pj-muted)' }}>Loading...</span></div>
  if (!playlist) return <div className="flex items-center justify-center min-h-screen"><p style={{ color: 'var(--pj-muted)' }}>Playlist not found.</p></div>

  const songs = playlist.songs ?? []
  const isPlaying = playing && songs.some(s => s.id === currentSong?.id)

  function handlePlayAll() {
    if (songs.length === 0) return
    if (isPlaying) { togglePlay(); return }
    if (currentSong && songs.some(s => s.id === currentSong.id)) { togglePlay(); return }
    play(songs[0], songs)
  }

  return (
    <div className="min-h-screen pb-32 max-w-2xl mx-auto px-4 pt-10">
      <Link to="/listen" className="text-sm mb-6 inline-block" style={{ color: 'var(--pj-secondary)' }}>← Listen</Link>

      <div className="flex items-start gap-5 mb-8">
        {playlist.cover_r2_key
          ? <img src={`/api/cover/${playlist.cover_r2_key}`} alt={playlist.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ background: 'var(--pj-surface)' }}>🎵</div>
        }
        <div>
          <h1 className="text-2xl font-extrabold mb-1">{playlist.title}</h1>
          {playlist.description && <p className="text-sm mb-3" style={{ color: 'var(--pj-muted)' }}>{playlist.description}</p>}
          <button onClick={handlePlayAll}
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'var(--pj-primary)', color: '#fff' }}>
            {isPlaying ? '⏸ Pause' : '▶ Play All'}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {songs.map((song, i) => (
          <div key={song.id} className="group relative">
            <TrackRow song={song} queue={songs} index={i} />
            <Link
              to={`/listen/${song.slug}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded"
              style={{ color: 'var(--pj-secondary)', background: 'rgba(27,42,78,0.08)' }}
              onClick={e => e.stopPropagation()}
            >Details</Link>
          </div>
        ))}
        {songs.length === 0 && <p className="text-center py-8" style={{ color: 'var(--pj-muted)' }}>No tracks yet.</p>}
      </div>
    </div>
  )
}
