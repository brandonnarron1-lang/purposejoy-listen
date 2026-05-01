import { useEffect, useState } from 'react';

const DISMISS_KEY = 'pjl-install-dismissed';
const DISMISS_DAYS = 30;

// Type for the Chrome/Edge prompt event (not in stock TS lib yet)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

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

function isDismissed(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) return false;
    const daysSince = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch { return false; }
}

type Mode = 'none' | 'ios' | 'native';

export default function InstallPrompt() {
  const [mode, setMode] = useState<Mode>('none');
  const [showGuide, setShowGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (isDismissed()) return;

    // Path 1: iOS Safari — show banner that opens manual guide
    if (isIOSSafari()) {
      const t = setTimeout(() => setMode('ios'), 8000);
      return () => clearTimeout(t);
    }

    // Path 2: Chrome / Edge / Android — wait for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault(); // suppress Chrome's default mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode('native');
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If installed via Chrome's UI mid-session, hide our banner
    const installedHandler = () => {
      setMode('none');
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* noop */ }
    setMode('none');
    setShowGuide(false);
  };

  const triggerNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setMode('none');
    } else {
      // user dismissed Chrome's prompt — also dismiss our banner for 30 days
      dismiss();
    }
  };

  if (mode === 'none') return null;

  return (
    <>
      {/* Pill banner — shared across iOS + native paths, label changes */}
      <button
        type="button"
        className="install-banner"
        onClick={mode === 'ios' ? () => setShowGuide(true) : triggerNativeInstall}
        aria-label={mode === 'ios' ? 'Show install instructions' : 'Install PurposeJoyListen'}
      >
        <img src="/icons/icon-192.png?v=2" alt="" className="install-banner-icon" />
        <div className="install-banner-text">
          <div className="install-banner-title">
            {mode === 'ios' ? 'Add PurposeJoyListen to Home Screen' : 'Install PurposeJoyListen'}
          </div>
          <div className="install-banner-sub">
            {mode === 'ios' ? 'Tap to learn how' : 'One-tap install'}
          </div>
        </div>
        <span className="install-banner-chevron" aria-hidden>
          {mode === 'ios' ? '›' : '⤓'}
        </span>
        <span
          className="install-banner-close"
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          role="button"
          aria-label="Dismiss"
        >×</span>
      </button>

      {/* iOS guide overlay — only when mode === 'ios' */}
      {showGuide && (
        <div
          className="install-guide-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGuide(false); }}
          role="presentation"
        >
          <div className="install-guide-sheet" role="dialog" aria-modal="true" aria-label="Install instructions">
            <button
              className="install-guide-close-x"
              onClick={() => setShowGuide(false)}
              aria-label="Close"
            >×</button>

            <h2 className="install-guide-title">Add to Home Screen</h2>
            <p className="install-guide-sub">3 quick steps in Safari</p>

            <div className="install-step">
              <div className="install-step-num">1</div>
              <div className="install-step-content">
                <div className="install-step-text">Tap the <b>Share</b> button</div>
                <div className="install-step-icon-row">
                  <svg className="install-step-share-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="6" y="10" width="12" height="11" rx="2" stroke="#FFD750" strokeWidth="1.6"/>
                    <path d="M12 14V3M12 3L8 7M12 3L16 7" stroke="#FFD750" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="install-step-helper">Bottom-center of Safari toolbar</span>
                </div>
              </div>
            </div>

            <div className="install-step">
              <div className="install-step-num">2</div>
              <div className="install-step-content">
                <div className="install-step-text">Scroll → Tap <b>Add to Home Screen</b></div>
                <div className="install-step-icon-row">
                  <svg className="install-step-plus-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#FFD750" strokeWidth="1.6"/>
                    <path d="M12 7V17M7 12H17" stroke="#FFD750" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <span className="install-step-helper">Look for the icon with a +</span>
                </div>
              </div>
            </div>

            <div className="install-step">
              <div className="install-step-num">3</div>
              <div className="install-step-content">
                <div className="install-step-text">Tap <b>Add</b> in the top-right corner</div>
                <div className="install-step-icon-row">
                  <span className="install-step-helper">Done — icon appears on home screen</span>
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
