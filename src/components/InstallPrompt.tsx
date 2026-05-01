import { useEffect, useState } from 'react';

const DISMISS_KEY = 'pjl-install-dismissed';
const DISMISS_DAYS = 30;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if ((navigator as any).standalone) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS && isSafari;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isIOSSafari()) return;
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed) {
        const daysSince = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_DAYS) return;
      }
    } catch { /* storage unavailable */ }
    const t = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* noop */ }
    setShow(false);
    setShowGuide(false);
  };

  if (!show) return null;

  return (
    <>
      {/* Pill banner — entire thing is tappable */}
      <button
        type="button"
        className="install-banner"
        onClick={() => setShowGuide(true)}
        aria-label="Show install instructions for PurposeJoyListen"
      >
        <img src="/icons/icon-192.png" alt="" className="install-banner-icon" />
        <div className="install-banner-text">
          <div className="install-banner-title">Add PurposeJoyListen to Home Screen</div>
          <div className="install-banner-sub">Tap to learn how</div>
        </div>
        <span className="install-banner-chevron" aria-hidden>›</span>
        <span
          className="install-banner-close"
          role="button"
          aria-label="Dismiss"
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
        >×</span>
      </button>

      {/* Guide overlay — bottom sheet */}
      {showGuide && (
        <div
          className="install-guide-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGuide(false); }}
          role="presentation"
        >
          <div className="install-guide-sheet" role="dialog" aria-modal="true" aria-label="Install PurposeJoyListen">
            <button
              className="install-guide-close-x"
              onClick={() => setShowGuide(false)}
              aria-label="Close"
            >×</button>

            <h2 className="install-guide-title">Add to Home Screen</h2>
            <p className="install-guide-sub">3 quick steps in Safari</p>

            {/* Step 1 — Share button */}
            <div className="install-step">
              <div className="install-step-num">1</div>
              <div className="install-step-content">
                <div className="install-step-text">Tap the <b>Share</b> button</div>
                <div className="install-step-icon-row">
                  {/* Safari share icon: box with upward arrow */}
                  <svg className="install-step-share-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="6" y="10" width="12" height="11" rx="2" stroke="#FFD750" strokeWidth="1.6"/>
                    <path d="M12 14V3M12 3L8 7M12 3L16 7" stroke="#FFD750" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="install-step-helper">Bottom-center of your Safari toolbar</span>
                </div>
              </div>
            </div>

            {/* Step 2 — Add to Home Screen */}
            <div className="install-step">
              <div className="install-step-num">2</div>
              <div className="install-step-content">
                <div className="install-step-text">Scroll down → Tap <b>Add to Home Screen</b></div>
                <div className="install-step-icon-row">
                  {/* Plus-in-square icon */}
                  <svg className="install-step-plus-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#FFD750" strokeWidth="1.6"/>
                    <path d="M12 7V17M7 12H17" stroke="#FFD750" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <span className="install-step-helper">Look for the icon with a +</span>
                </div>
              </div>
            </div>

            {/* Step 3 — Confirm */}
            <div className="install-step">
              <div className="install-step-num">3</div>
              <div className="install-step-content">
                <div className="install-step-text">Tap <b>Add</b> in the top-right corner</div>
                <div className="install-step-icon-row">
                  <span className="install-step-helper">Icon appears on your home screen</span>
                </div>
              </div>
            </div>

            <button className="install-guide-cta" onClick={() => setShowGuide(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
