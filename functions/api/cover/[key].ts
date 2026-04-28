import type { Env } from '../../_types'

// Route: /api/cover/:key  (key may contain slashes, encoded as _ or passed raw)
// To support slashes in key, caller passes encoded key and we decode
export const onRequestGet = async (ctx: { params: Record<string,string>; env: Env }) => {
  const rawKey = ctx.params.key
  if (!rawKey) return new Response('Missing key', { status: 400 })

  const object = await ctx.env.MEDIA.get(decodeURIComponent(rawKey))
  if (!object) return new Response('Not found', { status: 404 })

  const contentType = object.httpMetadata?.contentType ?? 'image/jpeg'
  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=2592000, immutable',
    },
  })
}
