import type { Env } from '../_types'

export const onRequestPost = async (ctx: { env: Env; request: Request }) => {
  try {
    const body = await ctx.request.json() as {
      song_id?: string
      playlist_id?: string
      event_type: string
      source?: string
    }

    const allowed = ['play','complete','download','share','admin_upload','admin_publish']
    if (!allowed.includes(body.event_type)) {
      return new Response(JSON.stringify({ error: 'Invalid event_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const ua = ctx.request.headers.get('User-Agent') ?? ''

    await ctx.env.DB.prepare(`
      INSERT INTO events (song_id, playlist_id, event_type, source, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.song_id ?? null,
      body.playlist_id ?? null,
      body.event_type,
      body.source ?? null,
      ua.substring(0, 500),
    ).run()

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
}
