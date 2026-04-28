import type { Env } from '../../_types'

export const onRequestGet = async (ctx: { env: Env }) => {
  const { results } = await ctx.env.DB.prepare(`
    SELECT
      s.id as song_id,
      s.title,
      s.slug,
      COUNT(CASE WHEN e.event_type = 'play' THEN 1 END) as plays,
      COUNT(CASE WHEN e.event_type = 'download' THEN 1 END) as downloads,
      COUNT(CASE WHEN e.event_type = 'share' THEN 1 END) as shares
    FROM songs s
    LEFT JOIN events e ON e.song_id = s.id
    GROUP BY s.id, s.title, s.slug
    ORDER BY plays DESC
  `).all()

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  })
}
