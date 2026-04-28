import type { Env } from '../_types'

export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env }) => {
  const { slug } = ctx.params

  const song = await ctx.env.DB.prepare(
    `SELECT id, audio_r2_key, download_enabled FROM songs WHERE slug = ? AND published = 1`
  ).bind(slug).first<{ id: string; audio_r2_key: string; download_enabled: number }>()

  if (!song) return new Response('Not found', { status: 404 })
  if (!song.download_enabled) return new Response('Download not available', { status: 403 })

  const object = await ctx.env.MEDIA.get(song.audio_r2_key)
  if (!object) return new Response('Audio file not found', { status: 404 })

  // Log download event (fire-and-forget)
  ctx.env.DB.prepare(
    `INSERT INTO events (song_id, event_type) VALUES (?, 'download')`
  ).bind(song.id).run().catch(() => {})

  return new Response(object.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${slug}.mp3"`,
      'Cache-Control': 'private',
    },
  })
}
