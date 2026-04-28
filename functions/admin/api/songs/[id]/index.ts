import type { Env } from '../../../../_types'

// PATCH /admin/api/songs/:id — update metadata / toggles
export const onRequestPatch = async (ctx: { params: Record<string,string>; env: Env; request: Request }) => {
  const { id } = ctx.params
  const existing = await ctx.env.DB.prepare(`SELECT * FROM songs WHERE id = ?`).bind(id).first()
  if (!existing) return json({ error: 'Not found' }, 404)

  const body = await ctx.request.json() as Record<string, unknown>
  const allowed = ['title','artist','album','description','lyrics','release_date',
                   'sort_order','download_enabled','published']
  const sets: string[] = []
  const vals: unknown[] = []

  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = ?`)
      vals.push(body[key])
    }
  }
  if (sets.length === 0) return json({ error: 'Nothing to update' }, 400)

  sets.push('updated_at = CURRENT_TIMESTAMP')
  vals.push(id)

  // If publishing, log event
  if ('published' in body && body.published === 1 && existing.published === 0) {
    await ctx.env.DB.prepare(`INSERT INTO events (song_id, event_type) VALUES (?, 'admin_publish')`).bind(id).run()
  }

  await ctx.env.DB.prepare(`UPDATE songs SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run()
  const updated = await ctx.env.DB.prepare(`SELECT * FROM songs WHERE id = ?`).bind(id).first()

  // Return confirmation payload for publish/hard-delete flows
  return json({
    song: updated,
    confirmation: {
      action: 'published' in body ? (body.published ? 'publish' : 'unpublish') : 'update',
      song_id: id,
      title: updated?.title,
    },
  })
}

// DELETE /admin/api/songs/:id
// Default: soft-delete (set published=0). Pass ?hard=true + header X-Confirm-Delete: yes for true delete.
export const onRequestDelete = async (ctx: { params: Record<string,string>; env: Env; request: Request }) => {
  const { id } = ctx.params
  const url = new URL(ctx.request.url)
  const hard = url.searchParams.get('hard') === 'true'
  const confirm = ctx.request.headers.get('X-Confirm-Delete')

  const song = await ctx.env.DB.prepare(`SELECT * FROM songs WHERE id = ?`).bind(id).first()
  if (!song) return json({ error: 'Not found' }, 404)

  if (hard) {
    if (confirm !== 'yes') {
      return json({
        confirmation_required: true,
        message: 'Send header X-Confirm-Delete: yes to permanently delete this song and its R2 files.',
        song_id: id,
        title: song.title,
      }, 409)
    }
    // Hard delete: remove R2 files + DB row
    if (song.audio_r2_key) await ctx.env.MEDIA.delete(song.audio_r2_key as string)
    if (song.cover_r2_key) await ctx.env.MEDIA.delete(song.cover_r2_key as string)
    await ctx.env.DB.prepare(`DELETE FROM songs WHERE id = ?`).bind(id).run()
    return json({ deleted: true, hard: true, song_id: id })
  }

  // Soft delete
  await ctx.env.DB.prepare(`UPDATE songs SET published = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run()
  return json({ deleted: false, archived: true, song_id: id, title: song.title })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
