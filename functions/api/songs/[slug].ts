import type { Env } from '../../_types'

export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env }) => {
  const { slug } = ctx.params
  const song = await ctx.env.DB.prepare(
    `SELECT * FROM songs WHERE slug = ? AND published = 1`
  ).bind(slug).first()

  if (!song) return json({ error: 'Not found' }, 404)
  return json(song, 200, { 'Cache-Control': 'public, max-age=120' })
}

function json(body: unknown, status = 200, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}
