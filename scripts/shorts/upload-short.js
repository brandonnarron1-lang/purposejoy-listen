#!/usr/bin/env node
'use strict';

// Defaults to a local preview. --upload sends one PRIVATE video after confirmation.
// --check-channel verifies the authorized channel without uploading a video.
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const readline = require('readline');

const BASE = path.resolve(__dirname, '../..');
const OAUTH_PATH = path.join(BASE, 'secrets/yt-oauth.json');
const APPROVED_DIR = path.join(BASE, 'INGEST/shorts/approved');
const RECEIPT_DIR = path.join(BASE, 'INGEST/shorts/uploaded');
const SHORTS_LOG = path.join(BASE, 'INGEST/shorts/shorts-log.json');
const EXPECTED_HANDLE = '@PurposeJoy';

function parseArgs(argv) {
  const args = { upload: false, checkChannel: false, help: argv.length === 0 };
  const values = { '--file': 'file', '--title': 'title', '--desc': 'desc', '--tags': 'tags' };
  let mode;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--help') { args.help = true; continue; }
    if (flag === '--check-channel') { args.checkChannel = true; continue; }
    if (flag === '--upload' || flag === '--dry-run') {
      if (mode && mode !== flag) throw new Error('Use either --upload or --dry-run.');
      mode = flag;
      args.upload = flag === '--upload';
      continue;
    }
    const key = values[flag];
    if (!key) throw new Error('Unknown argument: ' + flag);
    const value = argv[++i];
    if (!value || value.startsWith('--') || args[key] !== undefined) {
      throw new Error('Provide exactly one value for ' + flag + '.');
    }
    args[key] = value;
  }
  if (mode === '--dry-run' && args.checkChannel) {
    throw new Error('Run --check-channel separately from the zero-network --dry-run.');
  }
  if (!args.help && !args.file && (args.upload || !args.checkChannel)) {
    throw new Error('--file is required, except with --check-channel.');
  }
  return args;
}

function inspectFile(file) {
  const approved = fs.realpathSync(APPROVED_DIR);
  const filePath = fs.realpathSync(path.resolve(BASE, file));
  const relative = path.relative(approved, filePath);
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw new Error('The MP4 must be inside INGEST/shorts/approved after resolving symlinks.');
  }
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0 || path.extname(filePath).toLowerCase() !== '.mp4') {
    throw new Error('Choose one nonempty approved MP4.');
  }
  const filename = path.basename(filePath);
  const match = filename.match(/^short-(.+)-hook\d+/);
  return { filePath, filename, size: stat.size, mtimeMs: stat.mtimeMs, slug: match ? match[1] : null };
}

function buildMetadata(args, info) {
  const title = args.title || (info.slug ? info.slug + ' #Shorts' : 'PurposeJoy Short #Shorts');
  if (Array.from(title).length > 100) throw new Error('The title must be at most 100 characters.');
  return {
    snippet: {
      title,
      description: args.desc || [
        info.slug ? '"' + info.slug + '" — PurposeJoy' : 'PurposeJoy music',
        '',
        'Listen: https://player.purposejoy.org/',
        'YouTube: https://youtube.com/@PurposeJoy',
        '',
        '#PurposeJoy #MikeEatmon #Shorts'
      ].join('\n'),
      tags: args.tags ? args.tags.split(',').map(t => t.trim()).filter(Boolean) : ['PurposeJoy', 'MikeEatmon', 'Shorts'],
      categoryId: '10'
    },
    status: { privacyStatus: 'private', selfDeclaredMadeForKids: false }
  };
}

function requestJson(url, options = {}) {
  const { method = 'GET', headers = {}, body, label = 'Google API', timeout = 30000 } = options;
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 1024 * 1024) req.destroy(new Error('Response too large'));
      });
      res.on('error', () => reject(new Error(label + ': response failed.')));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(label + ' failed (HTTP ' + res.statusCode + '). No response body or credentials logged.'));
          return;
        }
        try {
          resolve({ data: data ? JSON.parse(data) : null, headers: res.headers });
        } catch (_) { reject(new Error(label + ': invalid JSON response.')); }
      });
    });
    req.setTimeout(timeout, () => req.destroy(new Error('Timeout')));
    req.on('error', () => reject(new Error(label + ': connection failed or timed out.')));
    if (body && typeof body.pipe === 'function') {
      body.on('error', () => req.destroy(new Error('Cannot read media')));
      req.on('close', () => body.destroy());
      body.pipe(req);
    } else { req.end(body); }
  });
}

function writeJsonAtomic(filename, value) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  if (fs.existsSync(filename) && fs.lstatSync(filename).isSymbolicLink()) {
    throw new Error('Refusing to replace a symlinked state file.');
  }
  const temporary = filename + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(descriptor, JSON.stringify(value, null, 2) + '\n');
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, filename);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function mergeRefreshedTokens(existing, tokens) {
  if (!tokens || typeof tokens.access_token !== 'string' || !tokens.access_token) {
    throw new Error('Google did not return an access token.');
  }
  // This merge is only for refreshing the SAME authorization, never a new OAuth grant.
  const refreshToken = tokens.refresh_token || existing.refresh_token;
  if (typeof refreshToken !== 'string' || !refreshToken) throw new Error('A refresh token is required.');
  const seconds = Number(tokens.expires_in);
  return {
    ...existing,
    access_token: tokens.access_token,
    refresh_token: refreshToken,
    scope: tokens.scope || existing.scope,
    expiry_date: Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 3600) * 1000,
    refreshedAt: new Date().toISOString()
  };
}

function assertChannelMatch(mine, resolved) {
  if (!mine || !Array.isArray(mine.items) || mine.items.length !== 1 ||
      !resolved || !Array.isArray(resolved.items) || resolved.items.length !== 1 ||
      !mine.items[0] || !resolved.items[0] || mine.nextPageToken || resolved.nextPageToken) {
    throw new Error('Could not uniquely verify the authorized channel and ' + EXPECTED_HANDLE + '. No upload started.');
  }
  const actual = mine.items[0];
  const intended = resolved.items[0];
  if (typeof actual.id !== 'string' || !/^UC[A-Za-z0-9_-]{22}$/.test(actual.id) || actual.id !== intended.id) {
    throw new Error('The authorized channel does not match ' + EXPECTED_HANDLE + '. No upload started.');
  }
  return { id: actual.id, title: actual.snippet && actual.snippet.title || EXPECTED_HANDLE, handle: EXPECTED_HANDLE };
}

async function authorize() {
  let oauth;
  try { oauth = JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8')); }
  catch (_) { throw new Error('Cannot read local secrets/yt-oauth.json. Complete the existing Google OAuth setup on this Mac.'); }
  if (!oauth.client_id || !oauth.refresh_token) throw new Error('Existing OAuth credentials are incomplete.');
  const form = new URLSearchParams({
    client_id: oauth.client_id,
    refresh_token: oauth.refresh_token,
    grant_type: 'refresh_token'
  });
  if (oauth.client_secret) form.set('client_secret', oauth.client_secret);
  const response = await requestJson('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(), label: 'Token refresh'
  });
  const refreshed = mergeRefreshedTokens(oauth, response.data);
  writeJsonAtomic(OAUTH_PATH, refreshed);
  const headers = { Authorization: 'Bearer ' + refreshed.access_token };
  const [mine, resolved] = await Promise.all([
    requestJson('https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true', { headers, label: 'Authorized-channel lookup (youtube.readonly required)' }),
    requestJson('https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=PurposeJoy', { headers, label: 'PurposeJoy handle lookup' })
  ]);
  return { accessToken: refreshed.access_token, channel: assertChannelMatch(mine.data, resolved.data) };
}

function validateUploadUrl(value) {
  let url;
  try { url = new URL(value); } catch (_) { throw new Error('Google did not return a valid upload-session URL.'); }
  if (url.protocol !== 'https:' || !/^(?:[a-z0-9-]+\.)*googleapis\.com$/i.test(url.hostname) || url.username || url.password || url.port) {
    throw new Error('Refusing an unexpected upload-session destination.');
  }
  return url.href;
}

function readLog() {
  if (!fs.existsSync(SHORTS_LOG)) return [];
  let log;
  try { log = JSON.parse(fs.readFileSync(SHORTS_LOG, 'utf8')); }
  catch (_) { throw new Error('The local upload log is unreadable; reconcile it before uploading.'); }
  if (!Array.isArray(log)) throw new Error('The local upload log must be an array.');
  return log;
}

async function upload(info, metadata, auth) {
  if (metadata.status.privacyStatus !== 'private') throw new Error('This uploader only accepts private uploads.');
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(info.filePath)) hash.update(chunk);
  const sha256 = hash.digest('hex');
  const current = fs.statSync(info.filePath);
  if (current.size !== info.size || current.mtimeMs !== info.mtimeMs) {
    throw new Error('The approved file changed after preview. Run the preview again.');
  }
  if (readLog().some(entry => entry.sha256 === sha256 && entry.channelId === auth.channel.id)) {
    throw new Error('This exact file already has a local upload receipt for this channel. Check YouTube Studio.');
  }
  const json = JSON.stringify(metadata);
  const session = await requestJson('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
      'Content-Type': 'application/json; charset=UTF-8',
      'Content-Length': Buffer.byteLength(json),
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': info.size
    },
    body: json,
    label: 'Create private upload'
  });
  const sessionUrl = validateUploadUrl(session.headers.location);
  let result;
  try {
    result = await requestJson(sessionUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4', 'Content-Length': info.size },
      body: fs.createReadStream(info.filePath),
      label: 'Video upload',
      timeout: 300000
    });
  } catch (_) {
    throw new Error('Upload completion is uncertain. Check YouTube Studio before retrying; no automatic retry was performed.');
  }
  if (!result.data || typeof result.data.id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(result.data.id)) {
    throw new Error('Upload response lacked a valid video ID. Check YouTube Studio before retrying.');
  }
  return { id: result.data.id, sha256 };
}

function recordUpload(info, metadata, auth, result) {
  const receipt = {
    uploadedAt: new Date().toISOString(), videoId: result.id,
    title: metadata.snippet.title, privacyStatus: 'private',
    sourceFile: info.filename, sourcePath: path.relative(BASE, info.filePath),
    slug: info.slug, sha256: result.sha256, channelId: auth.channel.id,
    youtubeStudio: 'https://studio.youtube.com/video/' + result.id + '/edit'
  };
  fs.mkdirSync(RECEIPT_DIR, { recursive: true, mode: 0o700 });
  const receiptPath = path.join(RECEIPT_DIR, result.id + '.json');
  const descriptor = fs.openSync(receiptPath, 'wx', 0o600);
  try { fs.writeFileSync(descriptor, JSON.stringify(receipt, null, 2) + '\n'); fs.fsyncSync(descriptor); }
  finally { fs.closeSync(descriptor); }
  const log = readLog();
  log.push(receipt);
  writeJsonAtomic(SHORTS_LOG, log);
  // Preserve the approved original; migration and backup workflows may depend on it.
}

function confirm(question) {
  if (!process.stdin.isTTY) throw new Error('Use an interactive terminal for --upload.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => {
    rl.close(); resolve(answer.trim().toLowerCase());
  }));
}

async function run(args, io) {
  if (args.help) {
    io.log('Preview: npm run shorts:upload -- --file INGEST/shorts/approved/ONE.mp4 [--title TITLE] [--desc TEXT] [--tags a,b]');
    io.log('Check account only: npm run shorts:upload -- --check-channel');
    io.log('Upload privately: add --upload. Publishing remains in YouTube Studio.');
    return 'help';
  }
  const info = args.file ? io.inspectFile(args.file) : null;
  const metadata = info ? buildMetadata(args, info) : null;
  if (metadata) io.log(JSON.stringify({ file: info.filename, bytes: info.size, intendedChannel: EXPECTED_HANDLE, metadata }, null, 2));
  if (!args.upload && !args.checkChannel) {
    io.log('DRY RUN: no network calls, credential reads, uploads or file changes.');
    return 'preview';
  }
  const auth = await io.authorize();
  io.log('Verified ' + EXPECTED_HANDLE + ': ' + JSON.stringify(auth.channel.title) + ' (' + auth.channel.id + ').');
  if (!args.upload) {
    io.log('Channel check complete. No video uploaded. Refreshed credentials were saved locally.');
    return 'verified';
  }
  if (!info || !metadata) throw new Error('--file is required for upload.');
  if (await io.confirm('Type yes to upload this video as PRIVATE: ') !== 'yes') {
    io.log('Aborted. No video uploaded.');
    return 'aborted';
  }
  const result = await io.upload(info, metadata, auth);
  const studio = 'https://studio.youtube.com/video/' + result.id + '/edit';
  io.log('YouTube accepted the private upload: ' + studio);
  try { await io.recordUpload(info, metadata, auth, result); }
  catch (_) {
    throw new Error('Video ' + result.id + ' was accepted, but its local receipt/log could not be completed. Do not upload again; reconcile in YouTube Studio.');
  }
  io.log('Receipt saved. Approved source preserved. Review audience/disclosure settings in YouTube Studio before publishing.');
  return 'uploaded';
}

module.exports = { parseArgs, buildMetadata, mergeRefreshedTokens, assertChannelMatch, validateUploadUrl, run };
if (require.main === module) {
  Promise.resolve().then(() => run(parseArgs(process.argv.slice(2)), {
    inspectFile, authorize, upload, recordUpload, confirm, log: message => console.log(message)
  })).catch(error => { console.error(error.message); process.exitCode = 1; });
}
