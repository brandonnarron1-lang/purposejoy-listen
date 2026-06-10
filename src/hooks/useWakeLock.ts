import { useEffect, useRef } from 'react'

/**
 * Acquires a Screen Wake Lock while `active` is true.
 * Silently no-ops on browsers that don't support the Wake Lock API.
 * Re-acquires on page visibility change (lock is auto-released when page hides).
 */
export function useWakeLock(active: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  const acquire = async () => {
    if (!active) return
    if (!('wakeLock' in navigator)) return
    try {
      lockRef.current = await (navigator as any).wakeLock.request('screen')
    } catch {
      // Permission denied or not supported — swallow
    }
  }

  const release = () => {
    if (lockRef.current) {
      lockRef.current.release().catch(() => {})
      lockRef.current = null
    }
  }

  useEffect(() => {
    if (active) {
      acquire()
    } else {
      release()
    }
    return release
  }, [active]) // eslint-disable-line

  // Re-acquire after page becomes visible (browser auto-releases on hide)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [active]) // eslint-disable-line
}
