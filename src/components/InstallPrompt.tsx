import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pj-install-prompt-dismissed';
const STORAGE_TTL_DAYS = 30;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
}

function shouldSuppress(): boolean {
  try {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) return false;
    const ts = parseInt(dismissed, 10);
    if (isNaN(ts)) return false;
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return ageDays < STORAGE_TTL_DAYS;
  } catch {
    return false;
  }
}

// Named export retained for backward compatibility with App.tsx import
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (shouldSuppress()) return;

    if (isIOS()) {
      const t = setTimeout(() => setShowIOSPrompt(true), 8000);
      return () => clearTimeout(t);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') {
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
    }
    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
    setShowIOSPrompt(false);
    setShowAndroidPrompt(false);
  };

  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="install-prompt install-prompt--android">
        <div className="install-prompt-content">
          <div className="install-prompt-icon">
            <img src="/icons/icon-192.png" alt="" width="48" height="48" />
          </div>
          <div className="install-prompt-text">
            <strong>Install PurposeJoy</strong>
            <span>Get the player on your home screen.</span>
          </div>
          <div className="install-prompt-actions">
            <button className="install-prompt-dismiss" onClick={handleDismiss}>Later</button>
            <button className="install-prompt-install" onClick={handleInstallAndroid}>Install</button>
          </div>
        </div>
      </div>
    );
  }

  if (showIOSPrompt) {
    return (
      <>
        {/* Tappable banner — opens the step guide */}
        <button
          className="install-prompt install-prompt--ios"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Show install instructions"
        >
          <div className="install-prompt-content">
            <div className="install-prompt-icon">
              <img src="/icons/icon-192.png" alt="" width="40" height="40" />
            </div>
            <div className="install-prompt-text">
              <strong>Install PurposeJoy</strong>
              <span>Tap here for install instructions →</span>
            </div>
            <button className="install-prompt-close" onClick={(e) => { e.stopPropagation(); handleDismiss(); }} aria-label="Dismiss">×</button>
          </div>
        </button>

        {/* Full-screen step guide */}
        {showIOSGuide && (
          <div className="install-guide-overlay" role="dialog" aria-modal="true" aria-label="Install PurposeJoy">
            <div className="install-guide-card">
              <button className="install-guide-close" onClick={() => setShowIOSGuide(false)} aria-label="Close">×</button>

              <img src="/icons/icon-192.png" alt="PurposeJoy icon" width="64" height="64" className="install-guide-appicon" />
              <h2 className="install-guide-title">Add to Home Screen</h2>
              <p className="install-guide-subtitle">Two taps. No app store needed.</p>

              <ol className="install-guide-steps">
                <li className="install-guide-step">
                  <span className="install-guide-step-num">1</span>
                  <div className="install-guide-step-body">
                    <span className="install-guide-step-label">Tap the Share button in Safari</span>
                    {/* Safari share icon — box with upward arrow */}
                    <svg className="install-guide-share-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <rect x="2" y="2" width="56" height="56" rx="12" fill="rgba(212,175,55,0.12)" stroke="#D4AF37" strokeWidth="2"/>
                      <rect x="18" y="26" width="24" height="20" rx="3" stroke="#FFD750" strokeWidth="2.5" fill="none"/>
                      <line x1="30" y1="10" x2="30" y2="32" stroke="#FFD750" strokeWidth="2.5" strokeLinecap="round"/>
                      <polyline points="22,18 30,9 38,18" stroke="#FFD750" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                    <span className="install-guide-step-hint">It's at the bottom center of your Safari toolbar</span>
                  </div>
                </li>
                <li className="install-guide-step">
                  <span className="install-guide-step-num">2</span>
                  <div className="install-guide-step-body">
                    <span className="install-guide-step-label">Scroll down and tap</span>
                    <span className="install-guide-step-action">"Add to Home Screen"</span>
                    <span className="install-guide-step-hint">Then tap Add in the top right</span>
                  </div>
                </li>
              </ol>

              {/* Arrow pointing to bottom of screen where Safari toolbar lives */}
              <div className="install-guide-arrow-wrap" aria-hidden>
                <span className="install-guide-arrow-label">Share button is down here</span>
                <svg className="install-guide-arrow-svg" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="12" y1="0" x2="12" y2="32" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3"/>
                  <polyline points="5,26 12,38 19,26" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>

              <button className="install-guide-done" onClick={() => setShowIOSGuide(false)}>Got it</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export default InstallPrompt;
