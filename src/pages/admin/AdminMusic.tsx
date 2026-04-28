import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Song, SongStats } from '../../types'

interface SongRow extends Song { plays?: number; downloads?: number; shares?: number }

export function AdminMusic() {
  const [songs, setSongs] = useState<SongRow[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState<{ song: SongRow; action: string } | null>(null)

  async function load() {
    const [songsRes, statsRes] = await Promise.all([
      fetch('/admin/api/songs').then(r => r.json()),
      fetch('/admin/api/stats').then(r => r.json()),
    ])
    const statsMap: Record<string, SongStats> = {}
    for (const s of (statsRes as SongStats[])) statsMap[s.song_id] = s
    setSongs((songsRes as Song[]).map(s => ({ ...s, ...statsMap[s.id] })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function togglePublished(song: SongRow) {
    const willPublish = song.published === 0
    if (willPublish) {
      setConfirmModal({ song, action: 'publish' })
      return
    }
    await patchSong(song.id, { published: 0 })
    await load()
  }

  async function patchSong(id: string, body: Record<string,unknown>) {
    const res = await fetch(`/admin/api/songs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  async function confirmPublish() {
    if (!confirmModal) return
    await patchSong(confirmModal.song.id, { published: 1 })
    setConfirmModal(null)
    await load()
  }

  async function archiveSong(song: SongRow) {
    setConfirmModal({ song, action: 'archive' })
  }

  async function confirmArchive() {
    if (!confirmModal) return
    await fetch(`/admin/api/songs/${confirmModal.song.id}`, { method: 'DELETE' })
    setConfirmModal(null)
    await load()
  }

  async function toggleDownload(song: SongRow) {
    await patchSong(song.id, { download_enabled: song.download_enabled ? 0 : 1 })
    await load()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--pj-bg)' }}>
      <span style={{ color: 'var(--pj-muted)' }}>Loading admin...</span>
    </div>
  )

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--pj-bg)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">PurposeJoy Admin</h1>
            <p className="text-sm" style={{ color: 'var(--pj-muted)' }}>Music management console</p>
          </div>
          <div className="flex gap-3">
            <Link to="/listen" className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--pj-surface)', color: 'var(--pj-text)' }}>
              ← View site
            </Link>
            <Link to="/admin/music/new"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--pj-primary)', color: '#fff' }}>
              + Upload song
            </Link>
          </div>
        </div>

        {/* Song table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--pj-surface)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(27,42,78,0.1)' }}>
                {['#','Song','Published','Download','Plays','DLs','Shares','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--pj-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {songs.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: 'var(--pj-muted)' }}>
                  No songs yet. Upload your first track!
                </td></tr>
              )}
              {songs.map((song, i) => (
                <tr key={song.id} style={{ borderBottom: '1px solid rgba(27,42,78,0.06)' }}
                  className="hover:bg-purple-900/10 transition-colors">
                  <td className="px-4 py-3" style={{ color: 'var(--pj-muted)' }}>{i+1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{song.title}</div>
                    <div className="text-xs" style={{ color: 'var(--pj-muted)' }}>{song.artist}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublished(song)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                      style={song.published
                        ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                        : { background: 'rgba(107,114,128,0.15)', color: '#6b7280' }
                      }>
                      {song.published ? '✓ Live' : '○ Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleDownload(song)}
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={song.download_enabled
                        ? { background: 'rgba(27,42,78,0.08)', color: 'var(--pj-secondary)' }
                        : { background: 'rgba(107,114,128,0.15)', color: '#6b7280' }
                      }>
                      {song.download_enabled ? '⬇ On' : '— Off'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--pj-text)' }}>{song.plays ?? 0}</td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--pj-text)' }}>{song.downloads ?? 0}</td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--pj-text)' }}>{song.shares ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/admin/music/${song.id}/edit`}
                        className="px-3 py-1 rounded text-xs"
                        style={{ background: 'rgba(27,42,78,0.08)', color: 'var(--pj-secondary)' }}>
                        Edit
                      </Link>
                      <button onClick={() => archiveSong(song)}
                        className="px-3 py-1 rounded text-xs"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
          <div className="rounded-2xl p-8 max-w-sm w-full mx-4" style={{ background: 'var(--pj-surface)' }}>
            <h2 className="text-lg font-bold mb-3">
              {confirmModal.action === 'publish' ? 'Publish to listeners?' : 'Archive this song?'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--pj-muted)' }}>
              {confirmModal.action === 'publish'
                ? `"${confirmModal.song.title}" will go live on /listen for all visitors.`
                : `"${confirmModal.song.title}" will be hidden from listeners (unpublished). Files are kept.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(107,114,128,0.2)', color: 'var(--pj-text)' }}>Cancel</button>
              <button
                onClick={confirmModal.action === 'publish' ? confirmPublish : confirmArchive}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={confirmModal.action === 'publish'
                  ? { background: '#22c55e', color: '#fff' }
                  : { background: '#ef4444', color: '#fff' }}>
                {confirmModal.action === 'publish' ? 'Yes, publish' : 'Yes, archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
