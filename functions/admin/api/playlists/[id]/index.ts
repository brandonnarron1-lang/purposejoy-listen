import type { Env } from '../../../../_types'

export const onRequestPatch = async (ctx: { params: Record<string,string>; env: Env; request: Request }) => {
  const { id } = ctx.params
  const body = await ctx.request.json() as Record<string,unknown>
  const allowed = ['title','description','published']
  const sets: string[] = []
  const vals: unknown[] = []
  for (const k of allowed) {
    if (k in body) { sets.push(`${k} = ?`); vals.push(body[k]) }
  }
  if (!sets.length) return json({ error: 'Nothing to update' }, 400)
  sets.push('updated_at = CURRENT_TIMESTAMP')
  vals.push(id)
  await ctx.env.DB.prepare(`UPDATE playlists SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run()
  const updated = await ctx.env.DB.prepare(`SELECT * FROM playlists WHERE id = ?`).bind(id).first()
  return json({ playlist: updated, confirmation: { action: 'updated', playlist_id: id } })
}

// Playlist items reorder: PUT /admin/api/playlists/:id  body: { items: [{song_id, track_order}] }
export const onRequestPut = async (ctx: { params: Record<string,string>; env: Env; request: Request }) => {
  const { id } = ctx.params
  const body = await ctx.request.json() as { items?: Array<{song_id: string; track_order: number}> }
  if (!body.items?.length) return json({ error: 'items required' }, 400)

  // Clear and reinsert
  await ctx.env.DB.prepare(`DELETE FROM playlist_items WHERE playlist_id = ?`).bind(id).run()
  const stmt = ctx.env.DB.prepare(
    `INSERT INTO playlist_items (playlist_id, song_id, track_order) VALUES (?, ?, ?)`
  )
  for (const item of body.items) {
    await stmt.bind(id, item.song_id, item.track_order).run()
  }
  return json({ ok: true, count: body.items.length })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
