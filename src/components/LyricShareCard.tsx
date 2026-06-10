import { useState } from 'react'
import { composeLyricCard, shareLyricCard, type CardFormat } from '../lib/composeLyricCard'
import { usePlayer } from '../context/PlayerContext'

interface LyricShareCardProps {
  lyricText: string
  onClose: () => void
}

export default function LyricShareCard({ lyricText, onClose }: LyricShareCardProps) {
  const { currentSong } = usePlayer()
  const [format, setFormat] = useState<CardFormat>('square')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  if (!currentSong) return null

  const coverUrl = currentSong.cover_r2_key
    ? `/api/cover/${currentSong.cover_r2_key}`
    : undefined

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const dataUrl = await composeLyricCard({
        lyricText,
        trackTitle: currentSong.title,
        artistName: currentSong.artist,
        coverUrl,
        format,
      })
      setPreview(dataUrl)
    } catch (e) {
      console.error('LyricShareCard compose error', e)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!preview) return
    try {
      await shareLyricCard(preview, currentSong.slug, currentSong.title)
    } catch {
      // User cancelled share — no-op
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(11,17,30,0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, gap: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#E8B14A', fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          Share Lyric
        </p>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#FAF7F2', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          aria-label="Close"
        >×</button>
      </div>

      {/* Lyric preview */}
      <div style={{
        width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.04)',
        borderRadius: 12, padding: '16px 20px',
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        color: '#FAF7F2', fontSize: 16, lineHeight: 1.6,
      }}>
        "{lyricText}"
      </div>

      {/* Format toggle */}
      <div style={{ display: 'flex', gap: 10 }}>
        {(['square', 'story'] as CardFormat[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFormat(f); setPreview(null) }}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: format === f ? '#E8B14A' : 'rgba(255,255,255,0.08)',
              color: format === f ? '#1B2A4E' : '#FAF7F2',
              fontWeight: format === f ? 700 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            {f === 'square' ? '1:1 Post' : '9:16 Story'}
          </button>
        ))}
      </div>

      {/* Canvas preview */}
      {preview && (
        <div style={{ maxWidth: 260, maxHeight: 260, overflow: 'hidden', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <img src={preview} alt="Lyric card preview" style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        {!preview ? (
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '12px 32px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: '#E8B14A', color: '#1B2A4E',
              fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Generating…' : 'Generate Card'}
          </button>
        ) : (
          <>
            <button
              onClick={() => setPreview(null)}
              style={{
                padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                background: 'none', color: '#FAF7F2', cursor: 'pointer',
                fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              Regenerate
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: '12px 32px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: '#E8B14A', color: '#1B2A4E',
                fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
              }}
            >
              Share / Download
            </button>
          </>
        )}
      </div>
    </div>
  )
}
