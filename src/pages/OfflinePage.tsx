export function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--pj-text)' }}>You're offline</h1>
      <p className="mb-6" style={{ color: 'var(--pj-muted)' }}>
        Connect to the internet to stream PurposeJoy music.
      </p>
      <button onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-full font-semibold"
        style={{ background: 'var(--pj-primary)', color: '#fff' }}>
        Try again
      </button>
    </div>
  )
}
