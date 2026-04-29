import type { Env } from '../../_types'

// Route: /api/cover/:key  (catch-all — key may contain slashes, e.g. "art/sng_xxx.png")
export const onRequestGet = async (ctx: { params: Record<string,string|string[]>; env: Env }) => {
  const raw = ctx.params.key
  if (!raw) return new Response('Missing key', { status: 400 })

  // Catch-all params come as string[] in Cloudflare Pages; join to reconstruct the R2 object key
  const r2Key = Array.isArray(raw) ? raw.join('/') : raw

  const object = await ctx.env.MEDIA.get(r2Key)
  if (!object) return new Response('Not found', { status: 404 })

  const contentType = object.httpMetadata?.contentType ?? 'image/png'
  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=2592000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
