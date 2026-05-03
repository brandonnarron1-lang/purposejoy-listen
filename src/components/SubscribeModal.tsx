import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'purposejoy_modal_dismissed';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  open: boolean;
  source: 'modal' | 'footer';
  onClose: () => void;
}

export function shouldShowSubscribeModal(): boolean {
  try {
    return !sessionStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

export default function SubscribeModal({ open, source, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleDismiss = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore
    }
    onClose();
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitState === 'loading') return;
    setSubmitState('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = (await res.json()) as { success: boolean; message?: string; error?: string };

      if (data.success) {
        setSubmitState('success');
        setMessage(data.message ?? "Check your inbox to confirm!");
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
      } else {
        setSubmitState('error');
        setMessage(data.error ?? 'Something went wrong — try again.');
      }
    } catch {
      setSubmitState('error');
      setMessage('Could not connect — check your connection and try again.');
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stay connected with PurposeJoy"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #1a0a2e 0%, #0d0618 100%)',
          border: '1px solid rgba(180,120,255,0.25)',
          borderRadius: '1rem',
          padding: '2rem 1.5rem',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          color: '#fff0d6',
        }}
      >
        {submitState === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Almost there
            </h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {message}
            </p>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(180,120,255,0.15)',
                border: '1px solid rgba(180,120,255,0.3)',
                borderRadius: '0.5rem',
                color: '#fff0d6',
                padding: '0.6rem 1.25rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Back to listening
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
              Like what you're hearing?
            </h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.75, marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Get notified when new music drops. No spam — just songs.
            </p>

            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitState === 'loading'}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(180,120,255,0.3)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff0d6',
                fontSize: '1rem',
                marginBottom: '0.75rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />

            {submitState === 'error' && (
              <p style={{ fontSize: '0.8rem', color: '#ff9999', marginBottom: '0.75rem' }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitState === 'loading'}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.7rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'linear-gradient(90deg, #b478ff, #7c3aed)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: submitState === 'loading' ? 'not-allowed' : 'pointer',
                opacity: submitState === 'loading' ? 0.7 : 1,
                marginBottom: '0.6rem',
              }}
            >
              {submitState === 'loading' ? 'Sending…' : 'Notify me'}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'rgba(255,240,214,0.45)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              No thanks
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
