export function PrivacyPage() {
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <main className="prose mx-auto max-w-prose px-6 py-16 pb-32" data-pj-sequence>
      <p className="eyebrow">Purpose &amp; Joy</p>
      <h1 className="font-display italic text-4xl">Privacy</h1>
      <p className="credit">Updated {updated}</p>
      <p className="drop-cap">This is the listening home for <em>Live With Purpose And Joy</em> by Mike Eatmon — a country gospel album by a man who writes for an audience of one and shares it with the rest of us. We built this site to let his songs reach you, and we collect as little about you as we can while doing that.</p>
      <h2 className="font-display italic">What we collect</h2>
      <ul>
        <li><strong>Anonymous usage</strong> — pageviews and play events through Cloudflare Web Analytics, so Mike can see which songs find people.</li>
        <li><strong>Listening progress</strong> — saved in your browser's local storage, only on your device. Never sent to us.</li>
        <li><strong>Server logs</strong> — IP, user agent, and request path, kept briefly for security and uptime.</li>
      </ul>
      <h2 className="font-display italic">What we don't</h2>
      <p>We don't ask for your name. We don't ask for your email. We don't track you off this site. We don't sell anything to anyone.</p>
      <h2 className="font-display italic">The infrastructure</h2>
      <p>Audio streams from Cloudflare R2. The site is hosted on Cloudflare Pages. They have their own privacy policies, and both are good ones.</p>
      <h2 className="font-display italic">Reaching us</h2>
      <p>Questions, takedown requests, or anything else: <a href="mailto:mike@ourtownproperties.com">mike@ourtownproperties.com</a>.</p>
      <hr className="rule-ornament" />
    </main>
  )
}
