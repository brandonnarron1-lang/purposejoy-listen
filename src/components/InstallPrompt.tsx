import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Track visit count
    const visits = parseInt(localStorage.getItem('pj_visits') ?? '0', 10) + 1
    localStorage.setItem('pj_visits', String(visits))

    const dismissed = localStorage.getItem('pj_install_dismissed')

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (visits >= 2 && !dismissed) setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Only show on /listen
  if (!location.pathname.startsWith('/listen') || !show || !deferredPrompt) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') localStorage.setItem('pj_install_dismissed', '1')
    setShow(false)
  }

  function handleDismiss() {
    localStorage.setItem('pj_install_dismissed', '1')
    setShow(false)
  }

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm max-w-xs w-[calc(100%-2rem)]"
      style={{ background: 'var(--pj-surface)', border: '1px solid rgba(27,42,78,0.2)' }}
    >
      <span className="text-xl">📲</span>
      <div className="flex-1">
        <p className="font-semibold" style={{ color: 'var(--pj-text)' }}>Install PurposeJoy</p>
        <p className="text-xs" style={{ color: 'var(--pj-muted)' }}>Listen offline, anytime</p>
      </div>
      <button onClick={handleInstall}
        className="px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: 'var(--pj-primary)', color: '#fff' }}>
        Install
      </button>
      <button onClick={handleDismiss} className="text-lg" style={{ color: 'var(--pj-muted)' }}>×</button>
    </div>
  )
}
