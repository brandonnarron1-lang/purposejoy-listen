import type { Env } from '../../_types'

export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env }) => {
  const { slug } = ctx.params
  const playlist = await ctx.env.DB.prepare(
    `SELECT * FROM playlists WHERE slug = ? AND published = 1`
  ).bind(slug).first()

  if (!playlist) return json({ error: 'Not found' }, 404)

  const { results: songs } = await ctx.env.DB.prepare(`
    SELECT s.* FROM songs s
    INNER JOIN playlist_items pi ON pi.song_id = s.id
    WHERE pi.playlist_id = ? AND s.published = 1
    ORDER BY pi.track_order ASC
  `).bind(playlist.id).all()

  return json({ ...playlist, songs }, 200, { 'Cache-Control': 'public, max-age=60' })
}

function json(body: unknown, status = 200, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}
