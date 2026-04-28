import type { Env } from '../_types'

export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env; next: () => Promise<Response> }) => {
  const { songSlug } = ctx.params
  const song = await ctx.env.DB.prepare(
    `SELECT * FROM songs WHERE slug = ? AND published = 1`
  ).bind(songSlug).first()

  const response = await ctx.next()
  if (!song) return response

  const title = `${song.title} — PurposeJoy`
  const desc = String(song.description ?? '').substring(0, 160) || 'Live With Purpose And Joy.'
  const url = `https://purposejoy.org/listen/${songSlug}`
  const image = `https://purposejoy.org/api/share-card/${songSlug}.png`
  const stream = `https://purposejoy.org/api/stream/${songSlug}`

  return new HTMLRewriter()
    .on('head', {
      element(el: Element) {
        el.prepend([
          `<meta property="og:title" content="${esc(title)}">`,
          `<meta property="og:description" content="${esc(desc)}">`,
          `<meta property="og:url" content="${esc(url)}">`,
          `<meta property="og:image" content="${esc(image)}">`,
          `<meta property="og:type" content="music.song">`,
          `<meta property="og:audio" content="${esc(stream)}">`,
          `<meta name="twitter:card" content="summary_large_image">`,
          `<meta name="twitter:title" content="${esc(title)}">`,
          `<meta name="twitter:description" content="${esc(desc)}">`,
          `<meta name="twitter:image" content="${esc(image)}">`,
          `<meta name="twitter:player" content="${esc(stream)}">`,
          `<title>${esc(title)}</title>`,
        ].join('\n    '), { html: true })
      }
    })
    .transform(response)
}

function esc(s: string) { return s.replace(/"/g, '&quot;').replace(/</g, '&lt;') }
