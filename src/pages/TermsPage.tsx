export function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 pb-32">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      {/* TODO: B-Nelly — replace with full terms of service before launch. */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--pj-surface)', color: 'var(--pj-muted)' }}>
        <p className="mb-4">These terms govern your use of PurposeJoy Listen.</p>
        <p className="mb-4">
          <strong style={{ color: 'var(--pj-text)' }}>⚠️ ACTION REQUIRED:</strong> This is a placeholder.
          Please replace with complete terms of service before launch.
        </p>
        <p className="mb-4">Music available for download is for personal listening only. Not for redistribution.</p>
        <p>Contact: <a href="mailto:hello@purposejoy.org" style={{ color: 'var(--pj-secondary)' }}>hello@purposejoy.org</a></p>
      </div>
    </div>
  )
}
