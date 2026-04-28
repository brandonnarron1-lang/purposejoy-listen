import type { Env } from '../../../_types'

// GET /admin/api/songs — all songs incl unpublished
export const onRequestGet = async (ctx: { env: Env }) => {
  const { results } = await ctx.env.DB.prepare(
    `SELECT * FROM songs ORDER BY sort_order ASC, created_at DESC`
  ).all()
  return json(results)
}

// POST /admin/api/songs — create new song
export const onRequestPost = async (ctx: { env: Env; request: Request }) => {
  try {
    const formData = await ctx.request.formData()
    const audioFile = formData.get('audio') as File | null
    const coverFile = formData.get('cover') as File | null
    const metaRaw = formData.get('metadata') as string | null

    if (!audioFile || !metaRaw) return json({ error: 'audio file and metadata required' }, 400)

    const meta = JSON.parse(metaRaw)
    const { title, artist = 'PurposeJoy', album, description, lyrics, release_date, download_enabled = 0, sort_order = 0 } = meta

    if (!title || !meta.slug) return json({ error: 'title and slug required' }, 400)

    const id = crypto.randomUUID()
    const slug = meta.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const audioKey = `audio/${id}.mp3`
    const coverKey = coverFile ? `art/${id}.${coverFile.name.split('.').pop()}` : null

    // Upload audio to R2
    await ctx.env.MEDIA.put(audioKey, audioFile.stream(), {
      httpMetadata: { contentType: 'audio/mpeg' },
    })

    // Upload cover to R2 if provided
    if (coverFile && coverKey) {
      await ctx.env.MEDIA.put(coverKey, coverFile.stream(), {
        httpMetadata: { contentType: coverFile.type || 'image/jpeg' },
      })
    }

    // Insert DB row (published=0 by default)
    await ctx.env.DB.prepare(`
      INSERT INTO songs (id, slug, title, artist, album, description, lyrics,
        audio_r2_key, cover_r2_key, release_date, download_enabled, sort_order, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(id, slug, title, artist, album ?? null, description ?? null, lyrics ?? null,
      audioKey, coverKey, release_date ?? null, download_enabled ? 1 : 0, sort_order).run()

    // Log upload event
    await ctx.env.DB.prepare(
      `INSERT INTO events (song_id, event_type) VALUES (?, 'admin_upload')`
    ).bind(id).run()

    const song = await ctx.env.DB.prepare(`SELECT * FROM songs WHERE id = ?`).bind(id).first()
    return json(song, 201)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return json({ error: msg }, 500)
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
