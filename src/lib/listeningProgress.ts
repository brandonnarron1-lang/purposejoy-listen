/**
 * Lightweight listening-progress tracker using localStorage.
 * Tracks per-slug listen state: 'unplayed' | 'in-progress' | 'listened'
 *
 * A track is 'listened' once the user has reached ≥ 50% playback.
 * No server calls — purely client-side, persists across sessions.
 */

export type ListenStatus = 'unplayed' | 'in-progress' | 'listened'

const STORAGE_KEY = 'pj_listen_progress'

interface ProgressStore {
  [slug: string]: ListenStatus
}

function load(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(store: ProgressStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Quota exceeded or private mode — swallow
  }
}

/**
 * Record playback progress for a slug.
 * @param slug     D1 song slug
 * @param fraction 0–1 playback fraction (currentTime / duration)
 */
export function recordProgress(slug: string, fraction: number): void {
  if (!slug || !isFinite(fraction)) return
  const store = load()
  const current = store[slug] ?? 'unplayed'

  // Never downgrade 'listened' back to 'in-progress'
  if (current === 'listened') return

  if (fraction >= 0.5) {
    store[slug] = 'listened'
  } else if (fraction > 0.02) {
    store[slug] = 'in-progress'
  }

  save(store)
}

/**
 * Get listen status for a single slug.
 */
export function getListenStatus(slug: string): ListenStatus {
  const store = load()
  return store[slug] ?? 'unplayed'
}

/**
 * React hook: returns current status for a slug.
 * Re-reads from localStorage on each render (cheap — no subscriptions needed
 * since updates are infrequent and triggered by the player useEffect).
 */
import { useState, useEffect } from 'react'

export function useListenStatus(slug: string): { status: ListenStatus } {
  const [status, setStatus] = useState<ListenStatus>(() => getListenStatus(slug))

  useEffect(() => {
    setStatus(getListenStatus(slug))
  }, [slug])

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setStatus(getListenStatus(slug))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [slug])

  return { status }
}
