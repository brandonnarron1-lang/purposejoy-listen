import type { Env } from '../../../_types'

export const onRequestGet = async (ctx: { env: Env }) => {
  const { results } = await ctx.env.DB.prepare(
    `SELECT * FROM playlists ORDER BY created_at DESC`
  ).all()
  return json(results)
}

export const onRequestPost = async (ctx: { env: Env; request: Request }) => {
  const body = await ctx.request.json() as { slug: string; title: string; description?: string; published?: number }
  if (!body.slug || !body.title) return json({ error: 'slug and title required' }, 400)
  const id = `pl_${crypto.randomUUID().split('-')[0]}`
  await ctx.env.DB.prepare(
    `INSERT INTO playlists (id, slug, title, description, published) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, body.slug, body.title, body.description ?? null, body.published ?? 0).run()
  const pl = await ctx.env.DB.prepare(`SELECT * FROM playlists WHERE id = ?`).bind(id).first()
  return json(pl, 201)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
