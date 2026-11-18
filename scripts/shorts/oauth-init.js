#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const BASE = path.resolve(__dirname, '../..');
const CLIENT_PATH = path.join(BASE, 'secrets/google-oauth-client.json');
const OAUTH_OUT = path.join(BASE, 'secrets/yt-oauth.json');
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

function readJson(text, label) {
  try { return JSON.parse(text); }
  catch { throw new Error(label + ' is not valid JSON. No credentials changed.'); }
}

function validateTokens(tokens) {
  if (!tokens || typeof tokens.access_token !== 'string' || !tokens.access_token ||
      typeof tokens.refresh_token !== 'string' || !tokens.refresh_token) {
    throw new Error('Google did not return both tokens. Existing credentials were not replaced.');
  }
  const granted = new Set(String(tokens.scope || '').split(/\s+/));
  if (!SCOPES.every(scope => granted.has(scope))) {
    throw new Error('Both YouTube upload and read-only permissions are required. Existing credentials were not replaced.');
  }
  if (!Number.isFinite(Number(tokens.expires_in)) || Number(tokens.expires_in) <= 0) {
    throw new Error('Google returned an invalid token expiry. Existing credentials were not replaced.');
  }
}

function verifyChannel(mine, target) {
  const owned = mine && mine.items;
  const named = target && target.items;
  if (!Array.isArray(owned) || owned.length !== 1 ||
      !Array.isArray(named) || named.length !== 1 ||
      !owned[0] || !named[0] || typeof owned[0].id !== 'string' ||
      !/^UC[A-Za-z0-9_-]{22}$/.test(owned[0].id) || owned[0].id !== named[0].id ||
      mine.nextPageToken || target.nextPageToken) {
    throw new Error('The authorized channel does not match @PurposeJoy. Existing credentials were not replaced.');
  }
  return owned[0].id;
}

function requestJson(url, options = {}, body = '') {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 1024 * 1024) {
          res.destroy();
          reject(new Error('Google response exceeded the size limit.'));
        }
      });
      res.on('error', () => reject(new Error('Google response could not be read.')));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); }
        catch { reject(new Error('Google returned an invalid JSON response.')); return; }
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
          reject(new Error('Google returned an invalid JSON object.')); return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300 || json.error) {
          const reason = typeof json.error === 'string' && /^[a-z_]+$/.test(json.error)
            ? ' (' + json.error + ')' : '';
          reject(new Error('Google request failed: HTTP ' + res.statusCode + reason + '.'));
          return;
        }
        resolve(json);
      });
    });
    const deadline = setTimeout(() => req.destroy(new Error('Request timed out.')), 30000);
    req.on('close', () => clearTimeout(deadline));
    req.on('error', () => reject(new Error('Google request failed or timed out.')));
    req.end(body);
  });
}

function receiveCode(state, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let timer;
    let resolveCode;
    let rejectCode;
    const code = new Promise((yes, no) => { resolveCode = yes; rejectCode = no; });
    code.catch(() => {}); // Bind rejection handling even before the listener is ready.
    function stop(error, value) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      process.removeListener('SIGINT', onInterrupt);
      process.removeListener('SIGTERM', onInterrupt);
      server.close();
      if (error) {
        if (server.closeAllConnections) server.closeAllConnections();
        rejectCode(error);
      } else resolveCode(value);
    }
    function onInterrupt() { stop(new Error('Authorization cancelled. Existing credentials were not replaced.')); }
    function reply(res, status, message) {
      res.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'Connection': 'close',
      });
      res.end(message);
    }
    const server = http.createServer((req, res) => {
      const address = server.address();
      if (finished || !address) { reply(res, 400, 'Authorization is closed.'); return; }
      const host = '127.0.0.1:' + address.port;
      if (req.method !== 'GET' || req.headers.host !== host) {
        reply(res, 400, 'Invalid authorization callback.');
        return;
      }
      let parsed;
      try { parsed = new URL(req.url, 'http://' + host); }
      catch { reply(res, 400, 'Invalid authorization callback.'); return; }
      if (parsed.pathname !== '/') { reply(res, 404, 'Not found.'); return; }
      const values = parsed.searchParams.getAll('state');
      const received = Buffer.from(values[0] || '');
      const expected = Buffer.from(state);
      if (values.length !== 1 || received.length !== expected.length ||
          !crypto.timingSafeEqual(received, expected)) {
        reply(res, 400, 'Invalid authorization state. Return to the original sign-in tab.');
        return;
      }
      if (parsed.searchParams.has('error')) {
        res.once('finish', () => stop(new Error('Google authorization was denied. Existing credentials were not replaced.')));
        reply(res, 400, 'Authorization was not granted. Return to the terminal.');
        return;
      }
      const codes = parsed.searchParams.getAll('code');
      if (codes.length !== 1 || !codes[0]) {
        res.once('finish', () => stop(new Error('Google returned no authorization code. Existing credentials were not replaced.')));
        reply(res, 400, 'Authorization code is missing. Return to the terminal.');
        return;
      }
      reply(res, 200, 'Authorization received. Return to the terminal for channel verification.');
      stop(null, codes[0]);
    });
    server.headersTimeout = 10000;
    server.requestTimeout = 10000;
    server.once('error', () => {
      const error = new Error('Could not start the local authorization callback.');
      stop(error);
      reject(error);
    });
    server.listen(0, '127.0.0.1', () => {
      timer = setTimeout(() => stop(new Error('Authorization timed out. Existing credentials were not replaced.')), timeoutMs);
      process.once('SIGINT', onInterrupt);
      process.once('SIGTERM', onInterrupt);
      resolve({ redirectUri: 'http://127.0.0.1:' + server.address().port + '/', code,
        cancel: () => stop(new Error('Authorization cancelled.')) });
    });
  });
}

function saveAtomically(file, value, original) {
  const directory = path.dirname(file);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  let current = null;
  try {
    if (!fs.lstatSync(file).isFile()) throw new Error('Token destination is not a regular file.');
    current = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (current !== original) throw new Error('Saved credentials changed during sign-in. They were not replaced.');
  const suffix = process.pid + '-' + crypto.randomBytes(8).toString('hex');
  const temporary = file + '.' + suffix + '.tmp';
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(descriptor, JSON.stringify(value, null, 2) + '\n');
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    if (current !== null) {
      fs.writeFileSync(file + '.' + suffix + '.bak', current, { flag: 'wx', mode: 0o600 });
    }
    fs.renameSync(temporary, file);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

async function main() {
  const raw = readJson(fs.readFileSync(CLIENT_PATH, 'utf8'), 'OAuth client file');
  const client = raw && raw.installed;
  if (!client || typeof client.client_id !== 'string' || !client.client_id ||
      typeof client.client_secret !== 'string' || !client.client_secret) {
    throw new Error('Use the original downloaded Desktop-app JSON from the existing Google project at secrets/google-oauth-client.json.');
  }
  let original = null;
  try {
    if (!fs.lstatSync(OAUTH_OUT).isFile()) throw new Error('Token destination is not a regular file.');
    original = fs.readFileSync(OAUTH_OUT, 'utf8');
    readJson(original, 'Existing token file');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const state = crypto.randomBytes(32).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const callback = await receiveCode(state);
  try {
    const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorization.search = new URLSearchParams({
      client_id: client.client_id, redirect_uri: callback.redirectUri,
      response_type: 'code', scope: SCOPES.join(' '), access_type: 'offline',
      prompt: 'consent', state, code_challenge: challenge, code_challenge_method: 'S256',
    }).toString();
    console.log('Open this URL in a browser on THIS SAME MAC and choose the PurposeJoy channel.');
    console.log('A phone browser cannot reach this Mac callback. Do not share the URL or paste authorization codes into chat.');
    console.log(authorization.toString());
    const code = await callback.code;
    const body = new URLSearchParams({
      client_id: client.client_id, client_secret: client.client_secret,
      code, code_verifier: verifier, redirect_uri: callback.redirectUri,
      grant_type: 'authorization_code',
    }).toString();
    const tokens = await requestJson('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, body);
    validateTokens(tokens);
    const expiresAt = Date.now() + Number(tokens.expires_in) * 1000;
    const access = { headers: { Authorization: 'Bearer ' + tokens.access_token } };
    const [mine, target] = await Promise.all([
      requestJson('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', access),
      requestJson('https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=PurposeJoy', access),
    ]);
    const channelId = verifyChannel(mine, target);
    saveAtomically(OAUTH_OUT, {
      client_id: client.client_id, client_secret: client.client_secret,
      redirect_uri: callback.redirectUri, scope: tokens.scope,
      refresh_token: tokens.refresh_token, access_token: tokens.access_token,
      expiry_date: expiresAt,
      createdAt: new Date().toISOString(),
    }, original);
    console.log('Verified @PurposeJoy (' + channelId + '). Credentials saved locally; prior file backed up if present. No video uploaded.');
  } finally { callback.cancel(); }
}

module.exports = { validateTokens, verifyChannel, saveAtomically, receiveCode };
if (require.main === module) main().catch(error => {
  console.error('OAuth setup failed: ' + error.message);
  process.exitCode = 1;
});
