#!/usr/bin/env node
/**
 * PurposeJoy Listen — identify-hooks.js
 * Scan normalized transcript files and surface hook candidates for Shorts.
 *
 * Usage: npm run shorts:identify
 *
 * Reads:  INGEST/transcripts/[slug].json   (normalized, seconds-based)
 * Writes: INGEST/shorts/pending/hooks-[timestamp].json
 *
 * A "hook" is a lyric window (10–59 seconds) that:
 *   1. Contains high-density syllable clusters (fast delivery)
 *   2. Appears in the first 25% of the track (pre-roll hook)
 *      OR starts with a repeated phrase from another line (chorus)
 *   3. Has a clear sentence boundary at start and end
 *
 * Output schema per candidate:
 *  {
 *    slug, title, hookIndex,
 *    startSec, endSec, durationSec,
 *    text, lines: [{text, start, end}],
 *    score,   // 0–100
 *    reason,  // human-readable rationale
 *  }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const BASE          = path.resolve(__dirname, '../..');
const TRANSCRIPTS   = path.join(BASE, 'INGEST/transcripts');
const OUT_DIR       = path.join(BASE, 'INGEST/shorts/pending');

// Shorts constraints (seconds)
const MIN_DURATION = 10;
const MAX_DURATION = 59;
const TARGET_SEC   = 30;    // sweet spot
const LINES_PER_HOOK = [2, 5]; // min/max lyric lines in window

// Scoring weights
const W_POSITION  = 25;  // starts in first 25% of track
const W_SYLLABLES = 35;  // syllable density
const W_DURATION  = 25;  // closeness to 30s target
const W_BOUNDARY  = 15;  // clean sentence boundaries

function countSyllables(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/);
  let count = 0;
  words.forEach(w => {
    const matches = w.toLowerCase().match(/[aeiouy]+/g);
    count += matches ? Math.max(1, matches.length) : 1;
  });
  return count;
}

function scoreCandidate(lines, totalDurationSec) {
  if (!lines.length) return 0;
  const startSec    = lines[0].start;
  const endSec      = lines[lines.length - 1].end;
  const durationSec = endSec - startSec;

  // Position score
  const positionRatio = totalDurationSec > 0 ? startSec / totalDurationSec : 0.5;
  const posScore = positionRatio <= 0.25 ? W_POSITION
                 : positionRatio <= 0.50 ? Math.round(W_POSITION * (1 - (positionRatio - 0.25) / 0.25))
                 : 0;

  // Syllable density score (target ~3–5 syllables/sec)
  const totalText  = lines.map(l => l.text).join(' ');
  const syllables  = countSyllables(totalText);
  const density    = durationSec > 0 ? syllables / durationSec : 0;
  const densScore  = Math.min(W_SYLLABLES, Math.round(W_SYLLABLES * Math.min(1, density / 4.5)));

  // Duration score (1.0 at target ±5s, 0.0 outside range)
  const distFromTarget = Math.abs(durationSec - TARGET_SEC);
  const durScore = Math.round(W_DURATION * Math.max(0, 1 - distFromTarget / 20));

  // Boundary score
  const firstText  = lines[0].text.trim();
  const lastText   = lines[lines.length - 1].text.trim();
  const cleanStart = /^[A-Z]/.test(firstText) ? 1 : 0;
  const cleanEnd   = /[.!?,]$/.test(lastText) ? 1 : 0;
  const boundScore = Math.round(W_BOUNDARY * (cleanStart + cleanEnd) / 2);

  return posScore + densScore + durScore + boundScore;
}

function buildReason(score, positionRatio, density, durationSec) {
  const parts = [];
  if (positionRatio <= 0.25)      parts.push('early hook (pre-roll)');
  else if (positionRatio <= 0.50) parts.push('mid-track hook');
  if (density >= 4)               parts.push(`high syllable density (${density.toFixed(1)}/s)`);
  parts.push(`${durationSec.toFixed(1)}s window`);
  if (score >= 70)                parts.push('⭐ strong candidate');
  return parts.join(' · ');
}

function extractHooks(slug, transcriptData) {
  const totalDurationSec = transcriptData.duration || 0;
  const lines = (transcriptData.lines || []).filter(l => l.text && l.text !== '[stub]');
  const hooks = [];

  if (lines.length < LINES_PER_HOOK[0]) return hooks;

  for (let start = 0; start < lines.length; start++) {
    for (let end = start + LINES_PER_HOOK[0] - 1; end < Math.min(lines.length, start + LINES_PER_HOOK[1]); end++) {
      const window     = lines.slice(start, end + 1);
      const startSec   = window[0].start;
      const endSec     = window[window.length - 1].end;
      const durationSec = endSec - startSec;

      if (durationSec < MIN_DURATION || durationSec > MAX_DURATION) continue;

      const score         = scoreCandidate(window, totalDurationSec);
      const positionRatio = totalDurationSec > 0 ? startSec / totalDurationSec : 0.5;
      const totalText     = window.map(l => l.text).join(' ');
      const syllables     = countSyllables(totalText);
      const density       = durationSec > 0 ? syllables / durationSec : 0;

      hooks.push({
        slug,
        title:       transcriptData.title || slug,
        hookIndex:   hooks.length,
        startSec:    parseFloat(startSec.toFixed(3)),
        endSec:      parseFloat(endSec.toFixed(3)),
        durationSec: parseFloat(durationSec.toFixed(3)),
        text:        totalText.trim(),
        lines:       window,
        score,
        reason:      buildReason(score, positionRatio, density, durationSec),
      });
    }
  }

  // Deduplicate overlapping windows — keep highest score
  const deduped = [];
  hooks.sort((a, b) => b.score - a.score);
  hooks.forEach(h => {
    const overlaps = deduped.some(d => h.startSec < d.endSec && h.endSec > d.startSec);
    if (!overlaps) deduped.push(h);
  });

  return deduped.sort((a, b) => a.startSec - b.startSec);
}

function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  PurposeJoy — Identify Shorts Hooks        ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  if (!fs.existsSync(TRANSCRIPTS)) {
    console.error(`❌  Transcripts dir not found: ${TRANSCRIPTS}`);
    console.error('   Run: npm run lyrics:normalize first');
    process.exit(1);
  }

  const files    = fs.readdirSync(TRANSCRIPTS).filter(f => f.endsWith('.json'));
  const allHooks = [];

  files.forEach(file => {
    const slug    = path.basename(file, '.json');
    const fpath   = path.join(TRANSCRIPTS, file);
    let data;
    try { data = JSON.parse(fs.readFileSync(fpath, 'utf8')); } catch (_) { return; }

    if (data.transcript_state !== 'ready') {
      console.log(`  skip ${slug}: transcript_state=${data.transcript_state || 'undefined'}`);
      return;
    }

    const hooks = extractHooks(slug, data);
    const label = (data.title || slug).substring(0, 32).padEnd(32);
    console.log(`  ${label}  ${hooks.length} hook(s)`);
    allHooks.push(...hooks);
  });

  if (!allHooks.length) {
    console.log('\n  No hook candidates found.');
    console.log('  Check that INGEST/transcripts/*.json have transcript_state: "ready"');
    console.log('  Run: npm run lyrics:normalize');
    return;
  }

  allHooks.sort((a, b) => b.score - a.score);
  allHooks.forEach((h, i) => { h.hookIndex = i; });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outPath   = path.join(OUT_DIR, `hooks-${timestamp}.json`);
  const output    = { generatedAt: new Date().toISOString(), count: allHooks.length, hooks: allHooks };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');

  console.log(`\n✅  Found ${allHooks.length} hook candidate(s).`);
  console.log('   Top 5 by score:');
  allHooks.slice(0, 5).forEach((h, i) =>
    console.log(`     ${i + 1}. [score ${h.score}] ${h.slug} @${h.startSec}s — ${h.reason}`)
  );
  console.log(`\n   Written: ${path.relative(BASE, outPath)}\n`);
}

main();
