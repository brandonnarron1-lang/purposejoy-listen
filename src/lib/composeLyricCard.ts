/**
 * Lyric share-card composer.
 * Renders a 1080×1080 (square) or 1080×1920 (Stories/Reels 9:16) canvas card
 * with the current lyric line, track info, and branding.
 *
 * Returns a PNG data URL suitable for Web Share API or download.
 */

export type CardFormat = 'square' | 'story'

interface LyricCardOptions {
  lyricText: string
  trackTitle: string
  artistName?: string
  coverUrl?: string   // absolute URL to cover image (CORS-enabled endpoint)
  format?: CardFormat
}

const CARD_DIMS: Record<CardFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story:  { w: 1080, h: 1920 },
}

/** PurposeJoy brand tokens */
const BRAND = {
  navy:   '#1B2A4E',
  gold:   '#E8B14A',
  offwhite: '#FAF7F2',
  muted:  '#5A6478',
}

/** Polyfill for ctx.roundRect — not typed in ES2020 DOM lib */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Wrap text to fit within maxWidth, returning array of lines.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function composeLyricCard(opts: LyricCardOptions): Promise<string> {
  const { lyricText, trackTitle, artistName = 'PurposeJoy', coverUrl, format = 'square' } = opts
  const { w, h } = CARD_DIMS[format]

  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // ── Background ────────────────────────────────────────────────────
  // Navy gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0E1A30')
  bg.addColorStop(1, '#1B2A4E')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // ── Cover art (blurred, full-bleed, 30% opacity) ──────────────────
  if (coverUrl) {
    const cover = await loadImage(coverUrl)
    if (cover) {
      ctx.save()
      ctx.globalAlpha = 0.18
      // Fill entire canvas preserving aspect ratio
      const scale = Math.max(w / cover.width, h / cover.height)
      const cw = cover.width * scale
      const ch = cover.height * scale
      const cx = (w - cw) / 2
      const cy = (h - ch) / 2
      ctx.filter = 'blur(40px)'
      ctx.drawImage(cover, cx, cy, cw, ch)
      ctx.filter = 'none'
      ctx.restore()
    }
  }

  // ── Gold accent bar (top) ─────────────────────────────────────────
  ctx.fillStyle = BRAND.gold
  ctx.fillRect(80, 80, 6, format === 'story' ? 120 : 80)

  // ── Cover art thumbnail (square, centered, upper portion) ─────────
  const thumbSize  = format === 'story' ? 280 : 220
  const thumbTop   = format === 'story' ? 220 : 160
  const thumbLeft  = (w - thumbSize) / 2
  const thumbRadius = 20

  if (coverUrl) {
    const cover = await loadImage(coverUrl)
    if (cover) {
      ctx.save()
      // Rounded rect clip
      roundRect(ctx, thumbLeft, thumbTop, thumbSize, thumbSize, thumbRadius)
      ctx.clip()
      ctx.drawImage(cover, thumbLeft, thumbTop, thumbSize, thumbSize)
      ctx.restore()
      // Subtle border
      ctx.strokeStyle = `${BRAND.gold}40`
      ctx.lineWidth = 2
      roundRect(ctx, thumbLeft, thumbTop, thumbSize, thumbSize, thumbRadius)
      ctx.stroke()
    }
  }

  // ── Lyric text ────────────────────────────────────────────────────
  const lyricTop  = thumbTop + thumbSize + (format === 'story' ? 100 : 70)
  const lyricMaxW = w - 160

  ctx.fillStyle = BRAND.offwhite
  ctx.textAlign = 'center'
  ctx.font      = `italic 500 ${format === 'story' ? 62 : 54}px Georgia, serif`

  const lines     = wrapText(ctx, lyricText, lyricMaxW)
  const lineH     = format === 'story' ? 82 : 72
  const totalH    = lines.length * lineH
  let   lineY     = lyricTop + lineH

  // Opening quotation mark
  ctx.font      = `italic 500 ${format === 'story' ? 90 : 78}px Georgia, serif`
  ctx.fillStyle = `${BRAND.gold}90`
  ctx.fillText('“', 80, lyricTop + (format === 'story' ? 70 : 60))

  ctx.font      = `italic 500 ${format === 'story' ? 62 : 54}px Georgia, serif`
  ctx.fillStyle = BRAND.offwhite
  for (const line of lines) {
    ctx.fillText(line, w / 2, lineY)
    lineY += lineH
  }

  // ── Track info ────────────────────────────────────────────────────
  const metaY = lyricTop + totalH + (format === 'story' ? 80 : 60)

  ctx.font      = `600 ${format === 'story' ? 34 : 30}px 'DM Sans', sans-serif`
  ctx.fillStyle = BRAND.gold
  ctx.fillText(trackTitle, w / 2, metaY)

  ctx.font      = `400 ${format === 'story' ? 26 : 22}px 'DM Sans', sans-serif`
  ctx.fillStyle = `${BRAND.offwhite}99`
  ctx.fillText(artistName, w / 2, metaY + (format === 'story' ? 48 : 40))

  // ── Branding (bottom) ─────────────────────────────────────────────
  const brandY = h - (format === 'story' ? 100 : 80)
  ctx.font      = `400 ${format === 'story' ? 26 : 22}px 'DM Sans', sans-serif`
  ctx.fillStyle = `${BRAND.offwhite}66`
  ctx.fillText('listen.purposejoy.org', w / 2, brandY)

  return canvas.toDataURL('image/png')
}

/**
 * Trigger a PNG download of the card in the browser.
 */
export function downloadLyricCard(dataUrl: string, slug: string): void {
  const a = document.createElement('a')
  a.href     = dataUrl
  a.download = `purposejoy-${slug}.png`
  a.click()
}

/**
 * Share the card via Web Share API (falls back to download).
 */
export async function shareLyricCard(
  dataUrl: string,
  slug: string,
  title: string,
): Promise<void> {
  if (navigator.share && navigator.canShare) {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], `purposejoy-${slug}.png`, { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `"${title}" — PurposeJoy`,
        url: 'https://listen.purposejoy.org',
      })
      return
    }
  }
  // Fallback: download
  downloadLyricCard(dataUrl, slug)
}
