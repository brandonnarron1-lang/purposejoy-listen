import { useState } from 'react'
import type { Song } from '../types'

interface ShareButtonProps {
  song: Song
  compact?: boolean
}

export function ShareButton({ song, compact }: ShareButtonProps) {
  const [open, setOpen] = useState(false)

  const url = `${location.origin}/listen/${song.slug}`
  const text = `${song.title} by ${song.artist} — PurposeJoy`

  function logShare(source: string) {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: song.id, event_type: 'share', source }),
    }).catch(() => {})
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
        logShare('native')
        return
      } catch (_) {}
    }
    setOpen(true)
  }

  function copyLink() {
    navigator.clipboard.writeText(url).catch(() => {})
    logShare('copy')
    setOpen(false)
  }

  const options = [
    { label: '🔗 Copy link', action: copyLink },
    { label: '💬 SMS', action: () => { window.open(`sms:?body=${encodeURIComponent(text + ' ' + url)}`); logShare('sms') } },
    { label: '✉️ Email', action: () => { window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`); logShare('email') } },
    { label: '𝕏 Twitter', action: () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`); logShare('twitter') } },
    { label: '📘 Facebook', action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`); logShare('facebook') } },
  ]

  return (
    <div className="relative">
      <button onClick={handleShare}
        className={compact ? 'text-xl' : 'px-4 py-2 rounded-full text-sm font-semibold'}
        style={compact ? { color: 'var(--pj-muted)' } : { background: 'var(--pj-surface)', color: 'var(--pj-text)', border: '1px solid rgba(27,42,78,0.2)' }}>
        {compact ? '↗' : '🔗 Share'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-t-2xl p-6 pb-10"
            style={{ background: 'var(--pj-surface)' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-center font-semibold mb-4">Share</p>
            {options.map(o => (
              <button key={o.label} onClick={o.action}
                className="w-full text-left py-3 px-4 rounded-xl mb-2 text-sm"
                style={{ background: 'rgba(27,42,78,0.06)' }}>
                {o.label}
              </button>
            ))}
            <button onClick={() => setOpen(false)} className="w-full text-center mt-2 text-sm" style={{ color: 'var(--pj-muted)' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
