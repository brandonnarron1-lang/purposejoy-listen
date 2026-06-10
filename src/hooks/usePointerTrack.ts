import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * usePointerTrack
 * Sets --mx / --my CSS custom properties on the target element
 * as a percentage of its bounding box, driven by pointermove.
 * Used for spotlight radial-gradient effects.
 *
 * Respects prefers-reduced-motion: no-op when reduced motion is requested.
 */
export function usePointerTrack<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Honour reduced-motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--mx', `${x.toFixed(1)}%`)
      el.style.setProperty('--my', `${y.toFixed(1)}%`)
    }

    const onLeave = () => {
      // Ease back to centre on leave
      el.style.setProperty('--mx', '50%')
      el.style.setProperty('--my', '50%')
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return ref
}
