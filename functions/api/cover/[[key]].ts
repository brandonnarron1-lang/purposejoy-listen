import type { Env } from '../../_types'

type Ctx = { params: Record<string, string | string[]>; env: Env; request: Request }

// Derive the WebP key: strip extension, append .webp
function toWebpKey(key: string): string {
  const dot = key.lastIndexOf('.')
  const stem = dot !== -1 ? key.slice(0, dot) : key
  return stem + '.webp'
}

// Route: /api/cover/:key  (catch-all — key may contain slashes, e.g. "art/sng_xxx.png")
async function handleCover(ctx: Ctx): Promise<Response> {
  const raw = ctx.params.key
  if (!raw) return new Response('Missing key', { status: 400 })

  // Catch-all params come as string[] in Cloudflare Pages; join to reconstruct the R2 object key
  const r2Key = Array.isArray(raw) ? raw.join('/') : raw

  // WebP negotiation: if client accepts WebP, try the .webp variant first
  const acceptsWebp = ctx.request.headers.get('Accept')?.includes('image/webp') ?? false
  let object: R2ObjectBody | null = null
  let servedContentType = 'image/webp'

  if (acceptsWebp) {
    const webpKey = toWebpKey(r2Key)
    object = await ctx.env.MEDIA.get(webpKey)
  }

  // Fall back to original key if no WebP or client doesn't accept it
  if (!object) {
    object = await ctx.env.MEDIA.get(r2Key)
    servedContentType = object?.httpMetadata?.contentType ?? 'image/jpeg'
  }

  if (!object) return new Response('Not found', { status: 404 })

  const headers = {
    'Content-Type': servedContentType,
    'Cache-Control': 'public, max-age=2592000, immutable',
    'Access-Control-Allow-Origin': '*',
    'Vary': 'Accept',
  }

  // HEAD: return headers only, no body
  if (ctx.request.method === 'HEAD') {
    return new Response(null, { headers })
  }

  return new Response(object.body, { headers })
}

export const onRequestGet = handleCover
export const onRequestHead = handleCover
