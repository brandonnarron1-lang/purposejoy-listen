export function TermsPage() {
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <main className="prose mx-auto max-w-prose px-6 py-16 pb-32" data-pj-sequence>
      <p className="eyebrow">Purpose &amp; Joy</p>
      <h1 className="font-display italic text-4xl">Terms</h1>
      <p className="credit">Updated {updated}</p>
      <p className="drop-cap">These songs are Mike Eatmon's. Listen as much as you want, share the lyric cards with your people, sing along in the car. The few things we ask are below.</p>
      <h2 className="font-display italic">The recordings</h2>
      <p>© Mike Eatmon, all rights reserved. Don't download, sample, re-upload, or distribute the master recordings without written permission. If you're a podcaster, sync supervisor, or worship leader and you want to use a song — reach out, the answer is often yes.</p>
      <h2 className="font-display italic">Lyric share cards</h2>
      <p>The lyric-card share feature is for your feed, your stories, your messages — personal use, freely. Commercial use (paid ads, branded content, merch you're selling) needs a written okay.</p>
      <h2 className="font-display italic">Use of the site</h2>
      <p>Don't try to break it, scrape it, or use it to harm anyone. Reasonable hospitality on both sides.</p>
      <h2 className="font-display italic">Changes</h2>
      <p>If these terms ever change, the date at the top of this page changes with them.</p>
      <h2 className="font-display italic">Reaching us</h2>
      <p><a href="mailto:mike@ourtownproperties.com">mike@ourtownproperties.com</a></p>
      <hr className="rule-ornament" />
    </main>
  )
}
