#!/usr/bin/env node
/**
 * prerender-seed.mjs
 * Runs after `vite build`. Fetches the purposejoy playlist directly from D1
 * via wrangler and inlines a slim seed payload into dist/index.html.
 *
 * Eliminates the /api/playlists/purposejoy round-trip from the critical render
 * path — ListenHome reads the seed synchronously instead of waiting for a
 * network fetch before painting tracks.
 *
 * Usage (auto-run via package.json build script):
 *   node scripts/prerender-seed.mjs
 */

import { execFileSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')
const DIST_HTML = join(ROOT, 'dist', 'index.html')

// Resolve wrangler.js directly — must use `--command=<sql>` as single concatenated
// arg (not two args). The shell shim strips quoting; node wrangler.js owns the array.
const req = createRequire(join(ROOT, 'package.json'))
const WRANGLER = req.resolve('wrangler/bin/wrangler.js')

function d1Select(sql) {
  const env = { ...process.env, CI: 'true' }
  delete env.CLOUDFLARE_API_TOKEN
  const out = execFileSync(
    process.execPath,
    [WRANGLER, 'd1', 'execute', 'purposejoy_db', '--remote', '--json', `--command=${sql}`],
    { cwd: ROOT, encoding: 'utf8', env }
  )
  const parsed = JSON.parse(out)
  if (!parsed[0]?.success) throw new Error(JSON.stringify(parsed[0]?.error ?? parsed))
  return parsed[0].results ?? []
}

// --- 1. Fetch playlist ---------------------------------------------------

console.log('[seed] Fetching playlist from D1...')

let playlist
try {
  const rows = d1Select(
    `SELECT id, slug, title, description, cover_r2_key, published FROM playlists WHERE slug = 'purposejoy' AND published = 1 LIMIT 1`
  )
  playlist = rows[0]
} catch (e) {
  console.error('[seed] playlist query failed:', e.message)
  process.exit(1)
}

if (!playlist) {
  console.error('[seed] No published playlist found')
  process.exit(1)
}

// --- 2. Fetch songs ------------------------------------------------------

let songs
try {
  songs = d1Select(
    `SELECT s.id, s.slug, s.title, s.artist, s.duration_seconds, s.cover_r2_key, s.audio_r2_key, s.sort_order, s.published, s.download_enabled, s.created_at, s.updated_at FROM songs s INNER JOIN playlist_items pi ON pi.song_id = s.id WHERE pi.playlist_id = '${playlist.id}' AND s.published = 1 ORDER BY pi.track_order ASC`
  )
} catch (e) {
  console.error('[seed] songs query failed:', e.message)
  process.exit(1)
}

console.log(`[seed] Got ${songs.length} songs for "${playlist.title}"`)

// --- 3. Build seed payload -----------------------------------------------
// Shape matches the Song + Playlist types exactly so ListenHome needs no transform.

const seed = {
  playlist: {
    id: playlist.id,
    slug: playlist.slug,
    title: playlist.title,
    description: playlist.description ?? '',
    cover_r2_key: playlist.cover_r2_key ?? null,
    published: playlist.published,
    created_at: '',
    updated_at: '',
  },
  songs: songs.map(s => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    artist: s.artist,
    duration_seconds: s.duration_seconds ?? 0,
    cover_r2_key: s.cover_r2_key ?? null,
    audio_r2_key: s.audio_r2_key,
    sort_order: s.sort_order,
    published: s.published,
    download_enabled: s.download_enabled ?? 0,
    created_at: s.created_at ?? '',
    updated_at: s.updated_at ?? '',
  })),
  generatedAt: new Date().toISOString(),
}

// --- 4. Inject into dist/index.html -------------------------------------

let html
try {
  html = readFileSync(DIST_HTML, 'utf8')
} catch {
  console.error('[seed] dist/index.html not found — run vite build first')
  process.exit(1)
}

if (!html.includes('</head>')) {
  console.error('[seed] </head> not found in dist/index.html')
  process.exit(1)
}

const seedScript = `<script id="pj-seed" type="application/json">${JSON.stringify(seed)}</script>`

if (html.includes('id="pj-seed"')) {
  html = html.replace(/<script id="pj-seed"[^>]*>[\s\S]*?<\/script>/, seedScript)
  console.log('[seed] Replaced existing seed script')
} else {
  html = html.replace('</head>', `  ${seedScript}\n  </head>`)
  console.log('[seed] Injected seed script into <head>')
}

writeFileSync(DIST_HTML, html, 'utf8')
console.log(`[seed] ✓ done — ${songs.length} songs, ${Buffer.byteLength(JSON.stringify(seed))} bytes`)
