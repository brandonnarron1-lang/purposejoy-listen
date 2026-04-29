import { useState, useEffect } from 'react'

interface LoadingSplashProps {
  onDone: () => void
}

export function LoadingSplash({ onDone }: LoadingSplashProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    // Hold after fade-in
    const holdTimer = setTimeout(() => setPhase('hold'), 400)
    // Begin fade-out
    const outTimer = setTimeout(() => setPhase('out'), 1600)
    // Notify parent done
    const doneTimer = setTimeout(() => onDone(), 2200)

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(outTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={phase === 'in' ? 'splash-in' : phase === 'out' ? 'splash-out' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0A0500 0%, #1B2A4E 100%)',
        gap: 28,
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Brand wordmark */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <img
          src="/brand/logo-warm.png"
          alt="PurposeJoy"
          style={{
            height: 'auto',
            width: 'min(280px, 70vw)',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.35))',
          }}
        />

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
            color: 'rgba(240,220,160,0.75)',
            letterSpacing: '0.12em',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Live With Purpose And Joy
        </p>
      </div>

      {/* Pulse loader */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#D4AF37',
              opacity: 0.7,
              animation: `splash-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-dot-pulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1.0; }
        }
      `}</style>
    </div>
  )
}
