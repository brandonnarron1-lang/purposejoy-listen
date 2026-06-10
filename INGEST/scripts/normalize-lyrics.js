#!/usr/bin/env node
/**
 * PurposeJoy Listen — normalize-lyrics.js
 * Convert Whisper JSON output into the D1 lyrics_timed format.
 *
 * Usage: npm run lyrics:normalize
 *
 * Reads:    INGEST/transcripts_raw/[slug].json     (Whisper JSON drop zone)
 * Writes:   INGEST/transcripts/[slug].json         (normalized, ready for D1)
 *           INGEST/scripts/update-lyrics.sql        (SQL UPDATE statements for D1)
 *
 * Whisper input format (from --output_format json):
 *   {
 *     text: string,
 *     segments: [{
 *       id, start, end, text,
 *       words: [{word, start, end, probability}]   // requires --word_timestamps True
 *     }]
 *   }
 *
 * lyrics_timed output format (D1 schema, times in SECONDS as floats):
 *   {
 *     words: [{ word: string, start: number, end: number }],
 *     lines: [{ text: string, start: number, end: number }],
 *     duration: number,
 *     plain_text: string
 *   }
 *
 * Normalized file also includes top-level metadata fields:
 *   {
 *     slug, transcript_state: "ready", normalizedAt: ISO string,
 *     words, lines, duration, plain_text
 *   }
 *
 * After running, push to D1:
 *   npm run lyrics:push
 *
 * Whisper command to generate compatible input:
 *   whisper /path/to/master.wav --model medium --language en \
 *     --output_format json --word_timestamps True \
 *     --output_dir INGEST/transcripts_raw/
 *   mv INGEST/transcripts_raw/master.json INGEST/transcripts_raw/[slug].json
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const BASE       = path.resolve(__dirname, '../..');
const RAW_DIR    = path.join(BASE, 'INGEST/transcripts_raw');
const OUT_DIR    = path.join(BASE, 'INGEST/transcripts');
const SQL_OUT    = path.join(BASE, 'INGEST/scripts/update-lyrics.sql');

// ── Whisper normalizer ────────────────────────────────────────────

/**
 * Build word array from Whisper segments.
 * Requires --word_timestamps True in Whisper call.
 * Falls back to segment-level timing if word timestamps absent.
 */
function extractWords(segments) {
  const words = [];

  segments.forEach(seg => {
    if (seg.words && seg.words.length) {
      // Word-level timestamps present
      seg.words.forEach(w => {
        const word = w.word.replace(/^\s+/, '').replace(/\s+$/, '');
        if (!word) return;
        words.push({
          word:  word,
          start: parseFloat(w.start.toFixed(3)),
          end:   parseFloat(w.end.toFixed(3)),
        });
      });
    } else {
      // Segment-level fallback: distribute evenly across words
      const segWords = seg.text.trim().split(/\s+/).filter(Boolean);
      if (!segWords.length) return;
      const segDur    = (seg.end - seg.start) / segWords.length;
      segWords.forEach((w, i) => {
        words.push({
          word:  w,
          start: parseFloat((seg.start + i * segDur).toFixed(3)),
          end:   parseFloat((seg.start + (i + 1) * segDur).toFixed(3)),
        });
      });
    }
  });

  return words;
}

/**
 * Build line array from Whisper segments.
 * One line per segment. Trims whitespace and filters blank lines.
 */
function extractLines(segments) {
  return segments
    .filter(seg => seg.text && seg.text.trim())
    .map(seg => ({
      text:  seg.text.trim(),
      start: parseFloat(seg.start.toFixed(3)),
      end:   parseFloat(seg.end.toFixed(3)),
    }));
}

/**
 * Normalize one Whisper JSON file into lyrics_timed format.
 * Returns the normalized object or throws on invalid input.
 */
function normalize(slug, whisperJson) {
  if (!whisperJson.segments || !Array.isArray(whisperJson.segments)) {
    throw new Error(`No segments array in Whisper output for ${slug}`);
  }

  const segments  = whisperJson.segments;
  const words     = extractWords(segments);
  const lines     = extractLines(segments);
  const plainText = lines.map(l => l.text).join('\n');
  const duration  = segments.length
    ? parseFloat(segments[segments.length - 1].end.toFixed(3))
    : 0;

  return {
    slug,
    transcript_state: 'ready',
    normalizedAt:     new Date().toISOString(),
    words,
    lines,
    duration,
    plain_text: plainText,
  };
}

/**
 * Escape single quotes for SQL string literals.
 */
function sqlEscape(str) {
  return str.replace(/'/g, "''");
}

/**
 * Generate UPDATE statement for one track.
 * Sets lyrics_timed (JSON string), transcript_state, and updated_at.
 */
function buildUpdateSql(slug, normalizedData) {
  const lyricsTimed = sqlEscape(JSON.stringify({
    words:      normalizedData.words,
    lines:      normalizedData.lines,
    duration:   normalizedData.duration,
    plain_text: normalizedData.plain_text,
  }));
  return (
    `UPDATE songs\n` +
    `  SET lyrics_timed = '${lyricsTimed}',\n` +
    `      transcript_state = 'ready',\n` +
    `      updated_at = CURRENT_TIMESTAMP\n` +
    `  WHERE slug = '${sqlEscape(slug)}';\n`
  );
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║  PurposeJoy — Normalize Lyrics (Whisper → D1)  ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  if (!fs.existsSync(RAW_DIR)) {
    console.error(`❌  Raw transcripts dir not found: ${RAW_DIR}`);
    console.error('   Drop Whisper JSON files into INGEST/transcripts_raw/[slug].json');
    process.exit(1);
  }

  const rawFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));

  if (!rawFiles.length) {
    console.log('  No raw transcript files found in INGEST/transcripts_raw/');
    console.log('  Run Whisper and place output there:');
    console.log('    whisper /path/to/master.wav --model medium --language en \\');
    console.log('      --output_format json --word_timestamps True \\');
    console.log('      --output_dir INGEST/transcripts_raw/');
    console.log('    mv INGEST/transcripts_raw/master.json INGEST/transcripts_raw/[slug].json');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sqlStatements = [
    '-- PurposeJoy Listen — lyrics_timed UPDATE statements',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Run with: npm run lyrics:push',
    '-- Or manually: npx wrangler d1 execute purposejoy_db --file=INGEST/scripts/update-lyrics.sql',
    '',
  ];

  let successCount = 0;
  let errorCount   = 0;

  rawFiles.forEach(file => {
    const slug    = path.basename(file, '.json');
    const rawPath = path.join(RAW_DIR, file);
    const outPath = path.join(OUT_DIR, file);

    console.log(`  processing: ${slug}`);

    let whisperJson;
    try {
      whisperJson = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    } catch (err) {
      console.error(`    ❌  JSON parse error: ${err.message}`);
      errorCount++;
      return;
    }

    let normalized;
    try {
      normalized = normalize(slug, whisperJson);
    } catch (err) {
      console.error(`    ❌  Normalize error: ${err.message}`);
      errorCount++;
      return;
    }

    // Write normalized transcript
    fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2) + '\n');
    console.log(`    ✓  ${normalized.words.length} words, ${normalized.lines.length} lines, ${normalized.duration}s`);

    // Accumulate SQL
    sqlStatements.push(`-- ${slug}`);
    sqlStatements.push(buildUpdateSql(slug, normalized));

    successCount++;
  });

  // Write SQL file (even if some errored — partial is still useful)
  if (successCount > 0) {
    fs.writeFileSync(SQL_OUT, sqlStatements.join('\n') + '\n');
    console.log(`\n✅  Normalized ${successCount} track(s).`);
    if (errorCount) console.log(`   ⚠️   ${errorCount} error(s) — see above.`);
    console.log(`\n   SQL written: ${path.relative(BASE, SQL_OUT)}`);
    console.log('   Push to D1:  npm run lyrics:push');
    console.log('   Or locally:  npx wrangler d1 execute purposejoy_db --local --file=INGEST/scripts/update-lyrics.sql\n');
  } else {
    console.log(`\n❌  All ${errorCount} files failed. Check Whisper output format.`);
    console.log('   Required: segments array with start/end fields.');
    console.log('   Recommended: --word_timestamps True for word-level sync.\n');
    process.exit(1);
  }
}

main();
