import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { Song } from '../../types'

export function AdminSongForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const audioRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', artist: 'PurposeJoy', album: '', description: '',
    lyrics: '', release_date: '', download_enabled: false, sort_order: 0, slug: '',
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [audioName, setAudioName] = useState('')
  const [coverName, setCoverName] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/admin/api/songs`)
      .then(r => r.json())
      .then((songs: Song[]) => {
        const s = songs.find(s => s.id === id)
        if (!s) return
        setForm({
          title: s.title, artist: s.artist, album: s.album ?? '',
          description: s.description ?? '', lyrics: s.lyrics ?? '',
          release_date: s.release_date ?? '', download_enabled: Boolean(s.download_enabled),
          sort_order: s.sort_order, slug: s.slug,
        })
      })
  }, [id])

  function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

  function handleTitle(v: string) {
    setForm(f => ({ ...f, title: v, slug: isEdit ? f.slug : slugify(v) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (isEdit) {
      // PATCH metadata only
      const res = await fetch(`/admin/api/songs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, artist: form.artist, album: form.album || null,
          description: form.description || null, lyrics: form.lyrics || null,
          release_date: form.release_date || null,
          download_enabled: form.download_enabled ? 1 : 0,
          sort_order: form.sort_order,
        }),
      })
      if (res.ok) navigate('/admin/music')
      else setError('Update failed')
      return
    }

    // New upload
    const audioFile = audioRef.current?.files?.[0]
    if (!audioFile) { setError('Audio file required'); return }
    if (!form.title) { setError('Title required'); return }

    setUploading(true)

    const formData = new FormData()
    formData.append('audio', audioFile)
    if (coverRef.current?.files?.[0]) formData.append('cover', coverRef.current.files[0])
    formData.append('metadata', JSON.stringify({
      title: form.title, artist: form.artist, album: form.album || null,
      description: form.description || null, lyrics: form.lyrics || null,
      release_date: form.release_date || null, slug: form.slug,
      download_enabled: form.download_enabled ? 1 : 0,
      sort_order: form.sort_order,
    }))

    // XHR for real progress tracking
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/admin/api/songs')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setUploading(false)
      if (xhr.status === 201) navigate('/admin/music')
      else setError(`Upload failed: ${xhr.responseText}`)
    }
    xhr.onerror = () => { setUploading(false); setError('Upload error') }
    xhr.send(formData)
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2'
  const inputStyle = { background: 'var(--pj-bg)', color: 'var(--pj-text)', border: '1px solid rgba(27,42,78,0.15)' }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--pj-bg)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/music" style={{ color: 'var(--pj-secondary)' }}>← Songs</Link>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Song' : 'Upload New Song'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEdit && (
            <>
              {/* Audio file */}
              <div>
                <label className="block text-sm font-semibold mb-2">Audio file (MP3) *</label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                  style={{ borderColor: 'rgba(27,42,78,0.2)', background: 'var(--pj-surface)' }}
                  onClick={() => audioRef.current?.click()}>
                  <div className="text-3xl mb-2">🎵</div>
                  <p className="text-sm" style={{ color: 'var(--pj-muted)' }}>
                    {audioName || 'Click to select MP3 file'}
                  </p>
                  <input ref={audioRef} type="file" accept="audio/mpeg,audio/mp3,.mp3" hidden
                    onChange={e => setAudioName(e.target.files?.[0]?.name ?? '')} />
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-sm font-semibold mb-2">Cover image (optional)</label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer"
                  style={{ borderColor: 'rgba(27,42,78,0.1)', background: 'var(--pj-surface)' }}
                  onClick={() => coverRef.current?.click()}>
                  <p className="text-sm" style={{ color: 'var(--pj-muted)' }}>
                    {coverName || 'Click to select image (JPG/PNG)'}
                  </p>
                  <input ref={coverRef} type="file" accept="image/*" hidden
                    onChange={e => setCoverName(e.target.files?.[0]?.name ?? '')} />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Title *</label>
            <input className={inputClass} style={inputStyle} value={form.title}
              onChange={e => handleTitle(e.target.value)} placeholder="Song title" required />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold mb-2">Slug (URL)</label>
              <input className={inputClass} style={inputStyle} value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="my-song-title" />
              <p className="text-xs mt-1" style={{ color: 'var(--pj-muted)' }}>
                /listen/{form.slug || 'my-song-title'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Artist</label>
              <input className={inputClass} style={inputStyle} value={form.artist}
                onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Album</label>
              <input className={inputClass} style={inputStyle} value={form.album}
                onChange={e => setForm(f => ({ ...f, album: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea className={inputClass} style={inputStyle} rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description visible to listeners" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Lyrics (markdown)</label>
            <textarea className={inputClass} style={inputStyle} rows={8} value={form.lyrics}
              onChange={e => setForm(f => ({ ...f, lyrics: e.target.value }))}
              placeholder="Verse 1&#10;..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Release date</label>
              <input type="date" className={inputClass} style={inputStyle} value={form.release_date}
                onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Sort order</label>
              <input type="number" className={inputClass} style={inputStyle} value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--pj-surface)' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, download_enabled: !f.download_enabled }))}
                className="w-11 h-6 rounded-full transition-colors relative"
                style={{ background: form.download_enabled ? 'var(--pj-primary)' : 'rgba(107,114,128,0.3)' }}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.download_enabled ? '1.5rem' : '0.25rem' }} />
              </div>
              <span className="text-sm font-semibold">Enable download</span>
            </label>
            <span className="text-xs" style={{ color: 'var(--pj-muted)' }}>
              Listeners can download this track (personal use disclaimer shown)
            </span>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {uploading && (
            <div className="rounded-xl p-4" style={{ background: 'var(--pj-surface)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--pj-muted)' }}>Uploading... {progress}%</p>
              <div className="h-2 rounded-full" style={{ background: 'rgba(27,42,78,0.1)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--pj-primary)' }} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link to="/admin/music" className="px-6 py-3 rounded-xl text-sm"
              style={{ background: 'var(--pj-surface)', color: 'var(--pj-text)' }}>Cancel</Link>
            <button type="submit" disabled={uploading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--pj-primary)', color: '#fff' }}>
              {isEdit ? 'Save changes' : (uploading ? `Uploading ${progress}%...` : 'Upload song')}
            </button>
          </div>
        </form>

        <p className="text-xs mt-6" style={{ color: 'var(--pj-muted)' }}>
          Note: Uploaded songs start as unpublished drafts. Go back to the song list and toggle Live to publish.
        </p>
      </div>
    </div>
  )
}
