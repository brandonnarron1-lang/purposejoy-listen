import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Song } from '../types'
import { usePlayer } from '../context/PlayerContext'
import { ShareButton } from '../components/ShareButton'

export function SongDetail() {
  const { songSlug } = useParams<{ songSlug: string }>()
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const { play, currentSong, playing, togglePlay } = usePlayer()

  const isActive = currentSong?.slug === songSlug

  useEffect(() => {
    if (!songSlug) return
    fetch(`/api/songs/${songSlug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setSong)
      .catch(() => setSong(null))
      .finally(() => setLoading(false))
  }, [songSlug])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><span style={{ color: 'var(--pj-muted)' }}>Loading...</span></div>
  if (!song) return <div className="flex items-center justify-center min-h-screen"><p style={{ color: 'var(--pj-muted)' }}>Song not found.</p></div>

  function handlePlay() {
    if (!song) return
    if (isActive) { togglePlay(); return }
    play(song)
  }

  return (
    <div className="min-h-screen pb-32 max-w-xl mx-auto px-6 pt-10">
      <Link to="/listen" className="text-sm mb-8 inline-block" style={{ color: 'var(--pj-secondary)' }}>← Back to playlist</Link>

      {/* Artwork */}
      <div className="w-full aspect-square rounded-2xl overflow-hidden mb-6 shadow-xl"
        style={{ background: 'var(--pj-surface)' }}>
        {song.cover_r2_key
          ? <img src={`/api/cover/${song.cover_r2_key}`} alt={song.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-8xl">♪</div>
        }
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--pj-text)' }}>{song.title}</h1>
      <p className="text-base mb-1" style={{ color: 'var(--pj-secondary)' }}>{song.artist}</p>
      {song.album && <p className="text-sm mb-4" style={{ color: 'var(--pj-muted)' }}>{song.album}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handlePlay}
          className="px-6 py-3 rounded-full font-semibold text-sm"
          style={{ background: 'var(--pj-primary)', color: '#fff' }}>
          {isActive && playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <ShareButton song={song} />
        {song.download_enabled === 1 && (
          <a
            href={`/download/${song.slug}`}
            download
            className="px-4 py-3 rounded-full text-sm font-semibold"
            style={{ background: 'var(--pj-surface)', color: 'var(--pj-text)', border: '1px solid rgba(124,58,237,0.4)' }}
            title="For personal listening. Not for redistribution."
          >
            ⬇ Download
          </a>
        )}
      </div>

      {/* Description */}
      {song.description && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--pj-surface)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--pj-text)' }}>{song.description}</p>
        </div>
      )}

      {/* Lyrics */}
      {song.lyrics && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--pj-text)' }}>Lyrics</h2>
          <pre className="text-sm leading-loose whitespace-pre-wrap font-sans"
            style={{ color: 'var(--pj-muted)' }}>{song.lyrics}</pre>
        </div>
      )}

      {song.release_date && (
        <p className="text-xs" style={{ color: 'var(--pj-muted)' }}>Released {song.release_date}</p>
      )}
    </div>
  )
}
