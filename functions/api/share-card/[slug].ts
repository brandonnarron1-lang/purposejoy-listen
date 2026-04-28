import type { Env } from '../../_types'

// GET /api/share-card/:slug.png
// Returns a 1200x630 OG image. First checks R2 cache, then generates SVG-based card.
export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env }) => {
  const rawSlug = ctx.params.slug?.replace(/\.png$/, '') ?? ''
  const cacheKey = `share/${rawSlug}.png`

  // Check R2 cache
  const cached = await ctx.env.MEDIA.get(cacheKey)
  if (cached) {
    return new Response(cached.body, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
    })
  }

  // Lookup song or playlist
  const song = await ctx.env.DB.prepare(`SELECT * FROM songs WHERE slug = ? AND published = 1`).bind(rawSlug).first()
  const playlist = song ? null : await ctx.env.DB.prepare(`SELECT * FROM playlists WHERE slug = ? AND published = 1`).bind(rawSlug).first()

  const title = song?.title ?? playlist?.title ?? 'PurposeJoy'
  const artist = song ? String(song.artist ?? 'PurposeJoy') : 'PurposeJoy'
  const desc = String(song?.description ?? playlist?.description ?? 'Live With Purpose And Joy.')

  // Generate SVG-based share card (inline, no external deps)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F0A1E"/>
      <stop offset="100%" style="stop-color:#1A0A3E"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#7C3AED"/>
      <stop offset="100%" style="stop-color:#A78BFA"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="8" height="630" fill="url(#accent)"/>
  <circle cx="1050" cy="100" r="200" fill="#7C3AED" opacity="0.12"/>
  <circle cx="200" cy="530" r="150" fill="#A78BFA" opacity="0.08"/>
  <text x="80" y="180" font-family="system-ui,sans-serif" font-size="96" fill="white" opacity="0.15">♪</text>
  <text x="80" y="320" font-family="system-ui,sans-serif" font-weight="800" font-size="72"
    fill="white" text-anchor="start">${escXML(String(title).substring(0,28))}</text>
  <text x="80" y="385" font-family="system-ui,sans-serif" font-size="36"
    fill="#A78BFA">${escXML(artist)}</text>
  <text x="80" y="450" font-family="system-ui,sans-serif" font-size="28"
    fill="#9CA3AF">${escXML(desc.substring(0, 80))}${desc.length > 80 ? '...' : ''}</text>
  <rect x="80" y="530" width="220" height="52" rx="26" fill="#7C3AED"/>
  <text x="190" y="564" font-family="system-ui,sans-serif" font-size="22"
    fill="white" text-anchor="middle" font-weight="600">▶ Listen Now</text>
  <text x="1120" y="590" font-family="system-ui,sans-serif" font-size="24"
    fill="#6B7280" text-anchor="end">purposejoy.org/listen</text>
</svg>`

  // Convert SVG to PNG via browser-compatible approach (return SVG as image/svg+xml, cached)
  const svgBytes = new TextEncoder().encode(svg)

  // Store in R2 for future hits (as SVG, served as image)
  await ctx.env.MEDIA.put(cacheKey, svgBytes, {
    httpMetadata: { contentType: 'image/svg+xml' },
  })

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

function escXML(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
