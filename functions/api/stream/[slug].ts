import type { Env } from '../../_types'

export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env; request: Request }) => {
  const { slug } = ctx.params

  // Fetch audio_r2_key AND download_enabled for gate check
  const song = await ctx.env.DB.prepare(
    `SELECT audio_r2_key, download_enabled, title, artist FROM songs WHERE slug = ? AND published = 1`
  ).bind(slug).first<{ audio_r2_key: string; download_enabled: number; title: string; artist: string }>()

  if (!song) return new Response('Not found', { status: 404 })

  // Download gate — only serve Content-Disposition when download_enabled = 1
  const url = new URL(ctx.request.url)
  const wantsDownload = url.searchParams.get('download') === '1'
  if (wantsDownload && song.download_enabled !== 1) {
    return new Response('Download not enabled for this track', { status: 403 })
  }

  const rangeHeader = ctx.request.headers.get('Range')
  const object = rangeHeader
    ? await ctx.env.MEDIA.get(song.audio_r2_key, { range: parseRange(rangeHeader) })
    : await ctx.env.MEDIA.get(song.audio_r2_key)

  if (!object) return new Response('Audio not found', { status: 404 })

  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  })

  if (object.size) headers.set('Content-Length', String(object.size))

  if (wantsDownload) {
    const safeTitle = song.title.replace(/[^a-zA-Z0-9 \-_]/g, '')
    const safeArtist = song.artist.replace(/[^a-zA-Z0-9 \-_]/g, '')
    headers.set('Content-Disposition', `attachment; filename="${safeTitle} — ${safeArtist}.mp3"`)
  }

  if (rangeHeader && object.range) {
    const r = object.range as { offset: number; length: number }
    const total = object.size ?? '*'
    headers.set('Content-Range', `bytes ${r.offset}-${r.offset + r.length - 1}/${total}`)
    return new Response(object.body, { status: 206, headers })
  }

  return new Response(object.body, { status: 200, headers })
}

function parseRange(header: string): R2Range {
  const m = header.match(/bytes=(\d+)-(\d*)/)
  if (!m) return { offset: 0 }
  const offset = parseInt(m[1], 10)
  const end = m[2] ? parseInt(m[2], 10) : undefined
  return end !== undefined ? { offset, length: end - offset + 1 } : { offset }
}

// HEAD: metadata only — no body fetch, no audio bandwidth
export const onRequestHead = async (ctx: { params: Record<string,string>; env: Env; request: Request }) => {
  const { slug } = ctx.params

  const song = await ctx.env.DB.prepare(
    `SELECT audio_r2_key FROM songs WHERE slug = ? AND published = 1`
  ).bind(slug).first<{ audio_r2_key: string }>()

  if (!song) return new Response(null, { status: 404 })

  const meta = await ctx.env.MEDIA.head(song.audio_r2_key)
  if (!meta) return new Response(null, { status: 404 })

  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  })
  if (meta.size) headers.set('Content-Length', String(meta.size))

  return new Response(null, { status: 200, headers })
}
