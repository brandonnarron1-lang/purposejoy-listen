import type { Env } from '../../_types'

export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env; next: () => Promise<Response> }) => {
  const { playlistSlug } = ctx.params
  const playlist = await ctx.env.DB.prepare(
    `SELECT * FROM playlists WHERE slug = ? AND published = 1`
  ).bind(playlistSlug).first()

  const response = await ctx.next()
  if (!playlist) return response

  const title = `${playlist.title} — PurposeJoy`
  const desc = String(playlist.description ?? '').substring(0, 160) || 'Live With Purpose And Joy.'
  const url = `https://purposejoy.org/listen/playlist/${playlistSlug}`
  const image = `https://purposejoy.org/api/share-card/${playlistSlug}.png`

  return new HTMLRewriter()
    .on('head', {
      element(el: Element) {
        el.prepend([
          `<meta property="og:title" content="${esc(title)}">`,
          `<meta property="og:description" content="${esc(desc)}">`,
          `<meta property="og:url" content="${esc(url)}">`,
          `<meta property="og:image" content="${esc(image)}">`,
          `<meta property="og:type" content="music.playlist">`,
          `<meta name="twitter:card" content="summary_large_image">`,
          `<title>${esc(title)}</title>`,
        ].join('\n    '), { html: true })
      }
    })
    .transform(response)
}

function esc(s: string) { return s.replace(/"/g, '&quot;').replace(/</g, '&lt;') }
