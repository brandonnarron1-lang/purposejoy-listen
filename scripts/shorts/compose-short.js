#!/usr/bin/env node
/**
 * PurposeJoy Listen — compose-short.js
 * Compose a Shorts MP4 from a hook entry.
 *
 * Usage:
 *   npm run shorts:compose -- --hook INGEST/shorts/pending/hooks-*.json --index 0 --audio /path/to/master.wav
 *
 * Requires: ffmpeg on PATH
 * Audio:    Brandon's local master files — NEVER yt-dlp
 *
 * Reads:
 *   INGEST/shorts/pending/hooks-*.json     (select one file + hookIndex)
 *   INGEST/covers_v2/optimized/[slug].jpg  (background cover)
 *
 * Output: INGEST/shorts/pending/short-[slug]-hook[N]-[timestamp].mp4
 *
 * Brandon reviews output → moves approved file to INGEST/shorts/approved/
 * Then runs: npm run shorts:upload -- --file INGEST/shorts/approved/short-*.mp4
 *
 * REQUIRES EXPLICIT HUMAN REVIEW. Never auto-approves. Never auto-uploads.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE      = path.resolve(__dirname, '../..');
const COVERS    = path.join(BASE, 'INGEST/covers_v2/optimized');
const OUT_DIR   = path.join(BASE, 'INGEST/shorts/pending');

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--hook')    args.hookFile  = argv[++i];
    if (argv[i] === '--index')   args.hookIndex = parseInt(argv[++i], 10);
    if (argv[i] === '--audio')   args.audioFile = argv[++i];
    if (argv[i] === '--dry-run') args.dryRun    = true;
  }
  return args;
}

function validateFfmpeg() {
  try { execSync('ffmpeg -version', { stdio: 'ignore' }); return true; }
  catch (_) { return false; }
}

function buildLyricFilter(hook, W, H) {
  const lines = (hook.lines || []).slice(0, 4);
  if (!lines.length) return '';

  const baseOffset = H - 120;
  const filters    = [];

  lines.forEach((line, i) => {
    const startSec = (line.start - hook.startSec).toFixed(3);
    const endSec   = (line.end   - hook.startSec).toFixed(3);
    const text     = (line.text || '')
      .replace(/'/g, '’')
      .replace(/:/g, '\\:')
      .replace(/[[\]{}]/g, '')
      .substring(0, 80);

    const y = baseOffset - (lines.length - 1 - i) * 60;
    filters.push(
      `drawtext=text='${text}':` +
      `enable='between(t,${startSec},${endSec})':` +
      `fontsize=38:fontcolor=white:` +
      `box=1:boxcolor=black@0.55:boxborderw=8:` +
      `x=(w-text_w)/2:y=${y}`
    );
  });

  return filters.join(',');
}

function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  PurposeJoy — Compose Short                 ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const args = parseArgs();

  if (!args.hookFile) {
    console.log('Usage: npm run shorts:compose -- --hook INGEST/shorts/pending/hooks-TIMESTAMP.json --index 0 --audio /path/to/master.wav');
    console.log('\nOptions:');
    console.log('  --hook      Path to hooks JSON file (from shorts:identify)');
    console.log('  --index     Hook index within the file (default: 0)');
    console.log('  --audio     Path to Brandon\'s local master audio file (WAV/AIFF/MP3)');
    console.log('  --dry-run   Print ffmpeg command without running it\n');
    process.exit(0);
  }

  const hookFile  = path.resolve(BASE, args.hookFile);
  const hookIndex = args.hookIndex || 0;
  const audioFile = args.audioFile ? path.resolve(args.audioFile) : null;

  if (!fs.existsSync(hookFile)) {
    console.error(`❌  Hook file not found: ${hookFile}`);
    process.exit(1);
  }
  if (!audioFile || !fs.existsSync(audioFile)) {
    console.error("❌  Audio file required. Pass Brandon's local master via --audio");
    console.error('   Never use yt-dlp. Use Brandon\'s original recording.\n');
    process.exit(1);
  }
  if (!validateFfmpeg()) {
    console.error('❌  ffmpeg not found on PATH. Install ffmpeg first.');
    process.exit(1);
  }

  const hooksData = JSON.parse(fs.readFileSync(hookFile, 'utf8'));
  const hooks     = hooksData.hooks || [];

  if (hookIndex >= hooks.length) {
    console.error(`❌  Hook index ${hookIndex} out of range (${hooks.length} hooks in file)`);
    process.exit(1);
  }

  const hook = hooks[hookIndex];
  const slug = hook.slug;

  // Find cover: prefer slug-specific, fall back to first jpg in dir
  let coverPath = path.join(COVERS, `${slug}.jpg`);
  if (!fs.existsSync(coverPath)) {
    const covers = fs.readdirSync(COVERS).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (!covers.length) {
      console.error(`❌  No cover image found in ${COVERS}`);
      process.exit(1);
    }
    coverPath = path.join(COVERS, covers[0]);
    console.log(`  ⚠️  No cover for ${slug} — using fallback: ${covers[0]}`);
  }

  console.log(`  Slug:     ${slug}`);
  console.log(`  Title:    ${hook.title || slug}`);
  console.log(`  Hook:     @${hook.startSec}s → +${hook.durationSec}s`);
  console.log(`  Score:    ${hook.score} — ${hook.reason}`);
  console.log(`  Text:     "${(hook.text || '').substring(0, 60)}…"`);
  console.log(`  Cover:    ${path.relative(BASE, coverPath)}`);
  console.log('');

  const W = 1080;
  const H = 1920;

  const lyricFilter = buildLyricFilter(hook, W, H);
  let vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  if (lyricFilter) vf += ',' + lyricFilter;
  vf += `,drawtext=text='@PurposeJoy':fontsize=28:fontcolor=white@0.80:x=w-text_w-30:y=h-50`;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outFile   = path.join(OUT_DIR, `short-${slug}-hook${hookIndex}-${timestamp}.mp4`);

  const cmd = [
    'ffmpeg',
    '-y',
    `-ss ${hook.startSec}`,
    `-t ${hook.durationSec}`,
    `-i "${audioFile}"`,
    `-loop 1 -i "${coverPath}"`,
    `-vf "${vf}"`,
    '-c:v libx264',
    '-preset fast',
    '-crf 22',
    '-pix_fmt yuv420p',
    '-c:a aac',
    '-b:a 192k',
    '-ar 44100',
    '-map 1:v:0',
    '-map 0:a:0',
    '-shortest',
    '-movflags +faststart',
    `"${outFile}"`,
  ].join(' ');

  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (args.dryRun) {
    console.log('  DRY RUN — ffmpeg command:');
    console.log('\n' + cmd + '\n');
    return;
  }

  console.log('  → Composing Short with ffmpeg…');
  const start = Date.now();

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (_) {
    console.error('\n❌  ffmpeg failed. See output above.');
    process.exit(1);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const stat    = fs.statSync(outFile);
  const mb      = (stat.size / 1024 / 1024).toFixed(1);

  console.log(`\n✅  Composed: ${path.relative(BASE, outFile)} (${mb} MB in ${elapsed}s)`);
  console.log('\n  ──────────────────────────────────────────────');
  console.log('  ✋  REVIEW REQUIRED before upload:');
  console.log(`     1. Watch the file: open "${outFile}"`);
  console.log('     2. If approved: mv to INGEST/shorts/approved/');
  console.log('     3. Then run:    npm run shorts:upload -- --file INGEST/shorts/approved/short-*.mp4');
  console.log('  ──────────────────────────────────────────────\n');
}

main();
