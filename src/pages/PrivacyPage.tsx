export function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 pb-32">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      {/* TODO: B-Nelly — replace this stub with the PurposeJoy privacy policy.
          Link to existing policy at purposejoy.org/privacy if one exists,
          or paste full policy text here. */}
      <div className="p-6 rounded-xl" style={{ background: 'var(--pj-surface)', color: 'var(--pj-muted)' }}>
        <p className="mb-4">This privacy policy applies to PurposeJoy Listen (purposejoy.org/listen).</p>
        <p className="mb-4">
          <strong style={{ color: 'var(--pj-text)' }}>⚠️ ACTION REQUIRED:</strong> This is a placeholder.
          Please replace this content with your full privacy policy before launch.
        </p>
        <p>Contact: <a href="mailto:hello@purposejoy.org" style={{ color: 'var(--pj-secondary)' }}>hello@purposejoy.org</a></p>
      </div>
    </div>
  )
}
