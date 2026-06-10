#!/usr/bin/env node
/**
 * PurposeJoy Listen — upload-short.js
 * Upload a single approved Short to YouTube.
 *
 * Usage:
 *   npm run shorts:upload -- --file INGEST/shorts/approved/short-[slug]-hook[N]-*.mp4
 *
 * Hard constraints (non-negotiable):
 *   1. ALWAYS shows full metadata and pauses for explicit "yes" confirmation
 *   2. NEVER sets privacyStatus to "public" — always uploads as "private"
 *      Brandon manually promotes to public in YouTube Studio after review
 *   3. NEVER auto-uploads. Every upload requires interactive approval.
 *   4. Moves file to INGEST/shorts/uploaded/ after successful upload
 *   5. Appends entry to INGEST/shorts/shorts-log.json
 *
 * Requires:
 *   - secrets/yt-oauth.json  (OAuth 2.0 credentials, youtube.upload scope)
 *   - Run scripts/shorts/oauth-init.js first to generate yt-oauth.json
 *
 * OAuth scope: https://www.googleapis.com/auth/youtube.upload
 * This scope is UPLOAD ONLY — cannot modify existing videos or channel data.
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const https    = require('https');

const BASE         = path.resolve(__dirname, '../..');
const OAUTH_PATH   = path.join(BASE, 'secrets/yt-oauth.json');
const SHORTS_LOG   = path.join(BASE, 'INGEST/shorts/shorts-log.json');
const APPROVED_DIR = path.join(BASE, 'INGEST/shorts/approved');
const UPLOADED_DIR = path.join(BASE, 'INGEST/shorts/uploaded');

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file')  args.file  = argv[++i];
    if (argv[i] === '--title') args.title = argv[++i];
    if (argv[i] === '--desc')  args.desc  = argv[++i];
    if (argv[i] === '--tags')  args.tags  = argv[++i];
  }
  return args;
}

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim().toLowerCase()); });
  });
}

function loadOAuth() {
  if (!fs.existsSync(OAUTH_PATH)) {
    console.error('\n❌  OAuth credentials not found at secrets/yt-oauth.json');
    console.error('   Run: node scripts/shorts/oauth-init.js');
    console.error('   Then complete the OAuth flow in your browser.\n');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8'));
}

async function refreshToken(oauth) {
  const body = new URLSearchParams({
    client_id:     oauth.client_id,
    client_secret: oauth.client_secret,
    refresh_token: oauth.refresh_token,
    grant_type:    'refresh_token',
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path:     '/token',
      method:   'POST',
      headers:  { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.error) reject(new Error(`Token refresh failed: ${json.error_description || json.error}`));
        else resolve(json.access_token);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function initiateUpload(accessToken, metadata, fileSize) {
  const metaStr = JSON.stringify(metadata);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      path:     '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      method:   'POST',
      headers:  {
        'Authorization':          `Bearer ${accessToken}`,
        'Content-Type':           'application/json; charset=UTF-8',
        'Content-Length':         Buffer.byteLength(metaStr),
        'X-Upload-Content-Type':  'video/mp4',
        'X-Upload-Content-Length': fileSize,
      },
    }, res => {
      if (res.statusCode === 200) {
        resolve(res.headers.location);
      } else {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => reject(new Error(`Initiate upload failed ${res.statusCode}: ${data}`)));
      }
    });
    req.on('error', reject);
    req.write(metaStr);
    req.end();
  });
}

async function uploadFile(uploadUrl, filePath) {
  const fileSize = fs.statSync(filePath).size;
  const fileData = fs.readFileSync(filePath);
  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'PUT',
      headers:  { 'Content-Type': 'video/mp4', 'Content-Length': fileSize },
    }, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) resolve(JSON.parse(data));
        else reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

function appendShortsLog(entry) {
  let log = [];
  if (fs.existsSync(SHORTS_LOG)) {
    try { log = JSON.parse(fs.readFileSync(SHORTS_LOG, 'utf8')); } catch (_) {}
  }
  log.push(entry);
  fs.writeFileSync(SHORTS_LOG, JSON.stringify(log, null, 2) + '\n');
}

// Infer slug from filename: short-[slug]-hook[N]-[timestamp].mp4
function inferSlugFromFilename(filename) {
  const match = filename.match(/^short-(.+)-hook\d+/);
  return match ? match[1] : null;
}

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  PurposeJoy — Upload Short                  ║');
  console.log('║  ⚠️  REQUIRES EXPLICIT HUMAN CONFIRMATION   ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const args = parseArgs();

  if (!args.file) {
    console.log('Usage: npm run shorts:upload -- --file INGEST/shorts/approved/short-[slug]-hook[N]-*.mp4');
    console.log('\nOptions:');
    console.log('  --file    Path to approved Short MP4 file (required)');
    console.log('  --title   Override default title');
    console.log('  --desc    Override default description');
    console.log('  --tags    Comma-separated tags\n');
    process.exit(0);
  }

  const filePath = path.resolve(BASE, args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌  File not found: ${filePath}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  const fileMB   = (fileSize / 1024 / 1024).toFixed(1);
  const slug     = inferSlugFromFilename(filename);

  const defaultTitle = args.title || (slug ? `${slug} #Shorts` : 'PurposeJoy Short #Shorts');
  const defaultDesc  = args.desc  || [
    slug ? `"${slug}" — from the PurposeJoy album` : 'From the PurposeJoy album',
    '',
    '🎵 Full album: https://listen.purposejoy.org',
    '▶ YouTube: https://youtube.com/@PurposeJoy',
    '',
    '#PurposeJoy #MikeEatmon #Shorts #Christian #Faith',
  ].join('\n');
  const defaultTags = args.tags
    ? args.tags.split(',').map(t => t.trim())
    : ['PurposeJoy', 'MikeEatmon', 'Shorts', 'Christian', 'Faith'];

  // ⚠️ CONFIRMATION GATE — always show full metadata and pause
  console.log('  ═══════════════════════════════════════════════');
  console.log('  UPLOAD DETAILS — review carefully before continuing');
  console.log('  ═══════════════════════════════════════════════');
  console.log(`  File:      ${filename} (${fileMB} MB)`);
  console.log(`  Slug:      ${slug || '(unknown)'}`);
  console.log(`  Privacy:   PRIVATE  (promote to public manually in YouTube Studio)`);
  console.log(`  Title:     ${defaultTitle}`);
  console.log(`  Desc:\n${defaultDesc.split('\n').map(l => '    ' + l).join('\n')}`);
  console.log(`  Tags:      ${defaultTags.join(', ')}`);
  console.log('  ═══════════════════════════════════════════════\n');

  const answer = await confirm('  ⚠️  Type "yes" to upload, anything else to abort: ');

  if (answer !== 'yes') {
    console.log('\n  Aborted. No upload performed.\n');
    process.exit(0);
  }

  console.log('\n  → Loading OAuth credentials…');
  const oauth       = loadOAuth();
  const accessToken = await refreshToken(oauth);
  console.log('  ✓ Access token refreshed');

  const metadata = {
    snippet: {
      title:       defaultTitle,
      description: defaultDesc,
      tags:        defaultTags,
      categoryId:  '10',  // Music
    },
    status: {
      privacyStatus:           'private',  // ALWAYS private — never public
      selfDeclaredMadeForKids: false,
    },
  };

  console.log('\n  → Initiating resumable upload…');
  const uploadUrl = await initiateUpload(accessToken, metadata, fileSize);
  console.log('  ✓ Upload session initiated');

  console.log(`  → Uploading ${fileMB} MB…`);
  const result     = await uploadFile(uploadUrl, filePath);
  const newVideoId = result.id;

  console.log(`\n  ✓ Upload complete! Video ID: ${newVideoId}`);
  console.log(`    YouTube Studio: https://studio.youtube.com/video/${newVideoId}/edit`);

  fs.mkdirSync(UPLOADED_DIR, { recursive: true });
  const destPath = path.join(UPLOADED_DIR, filename);
  fs.renameSync(filePath, destPath);
  console.log(`  ✓ Moved to: INGEST/shorts/uploaded/${filename}`);

  appendShortsLog({
    uploadedAt:    new Date().toISOString(),
    videoId:       newVideoId,
    title:         defaultTitle,
    privacyStatus: 'private',
    sourceFile:    filename,
    slug:          slug || null,
    youtubeStudio: `https://studio.youtube.com/video/${newVideoId}/edit`,
  });
  console.log('  ✓ Logged to INGEST/shorts/shorts-log.json');

  console.log('\n  ──────────────────────────────────────────────');
  console.log('  ✅  Short uploaded (PRIVATE).');
  console.log(`     Studio URL: https://studio.youtube.com/video/${newVideoId}/edit`);
  console.log('     Review in YouTube Studio, then set to Public when ready.');
  console.log('  ──────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('\n❌  Upload error:', err.message);
  process.exit(1);
});
