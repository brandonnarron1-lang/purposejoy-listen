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
      <div className="install-prompt install-prompt--ios" style={{ position: 'relative' }}>
        <button className="install-prompt-close" onClick={handleDismiss} aria-label="Dismiss">×</button>
        <div className="install-prompt-content">
          <div className="install-prompt-icon">
            <img src="/icons/icon-192.png" alt="" width="48" height="48" />
          </div>
          <div className="install-prompt-text">
            <strong>Install PurposeJoy</strong>
            <span>
              Tap <span className="install-prompt-share-icon" aria-hidden>⎙</span> then &ldquo;Add to Home Screen&rdquo;.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default InstallPrompt;
