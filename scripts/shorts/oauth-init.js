#!/usr/bin/env node
/**
 * PurposeJoy Listen — oauth-init.js
 * One-time OAuth 2.0 setup for YouTube uploads.
 *
 * Run ONCE to generate secrets/yt-oauth.json.
 * Upload script uses the refresh token from that file on subsequent runs.
 *
 * Prerequisites:
 *   1. Create an OAuth 2.0 "Desktop app" credential in Google Cloud Console
 *   2. Download the credentials JSON as secrets/google-oauth-client.json
 *   3. Enable YouTube Data API v3 on the project
 *   4. Run: node scripts/shorts/oauth-init.js
 *   5. Open the URL printed in your browser, complete the flow
 *   6. Paste the authorization code when prompted
 *
 * Output: secrets/yt-oauth.json
 *   { client_id, client_secret, redirect_uri, access_token, refresh_token, expiry_date }
 *
 * Scopes granted: https://www.googleapis.com/auth/youtube.upload
 * This scope is UPLOAD ONLY — cannot read private channel data,
 * cannot modify existing videos, cannot touch playlists.
 *
 * SECURITY:
 *   - secrets/ is gitignored
 *   - Never commit yt-oauth.json or google-oauth-client.json
 *   - Never log access_token or refresh_token to console
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const https    = require('https');
const readline = require('readline');

const BASE        = path.resolve(__dirname, '../..');
const SECRETS_DIR = path.join(BASE, 'secrets');
const OAUTH_OUT   = path.join(SECRETS_DIR, 'yt-oauth.json');
const CLIENT_PATH = path.join(SECRETS_DIR, 'google-oauth-client.json');

const SCOPE        = 'https://www.googleapis.com/auth/youtube.upload';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';  // out-of-band for CLI

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

function exchangeCode(clientId, clientSecret, code) {
  const body = new URLSearchParams({
    code,
    client_id:     clientId,
    client_secret: clientSecret,
    redirect_uri:  REDIRECT_URI,
    grant_type:    'authorization_code',
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
        if (json.error) reject(new Error(`Token exchange failed: ${json.error_description || json.error}`));
        else resolve(json);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  PurposeJoy — YouTube OAuth Init              ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  if (!fs.existsSync(CLIENT_PATH)) {
    console.error('❌  OAuth client credentials not found at:');
    console.error(`    ${CLIENT_PATH}\n`);
    console.error('  Steps to create:');
    console.error('  1. Go to: https://console.cloud.google.com/apis/credentials');
    console.error('  2. Create Credentials → OAuth 2.0 Client IDs → Desktop app');
    console.error('  3. Download JSON → save to secrets/google-oauth-client.json');
    console.error('  4. Re-run: node scripts/shorts/oauth-init.js\n');
    process.exit(1);
  }

  if (fs.existsSync(OAUTH_OUT)) {
    const answer = await ask('  ⚠️  yt-oauth.json already exists. Overwrite? (yes/no): ');
    if (answer !== 'yes') {
      console.log('  Aborted. Existing credentials unchanged.\n');
      process.exit(0);
    }
  }

  const clientRaw  = JSON.parse(fs.readFileSync(CLIENT_PATH, 'utf8'));
  const clientData = clientRaw.installed || clientRaw.web || clientRaw;
  const clientId   = clientData.client_id;
  const clientSec  = clientData.client_secret;

  if (!clientId || !clientSec) {
    console.error('❌  Could not read client_id / client_secret from credentials file.');
    process.exit(1);
  }

  const authUrl = [
    'https://accounts.google.com/o/oauth2/v2/auth',
    `?client_id=${encodeURIComponent(clientId)}`,
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    `&response_type=code`,
    `&scope=${encodeURIComponent(SCOPE)}`,
    `&access_type=offline`,
    `&prompt=consent`,
  ].join('');

  console.log('  STEP 1: Open this URL in your browser:\n');
  console.log('  ' + authUrl);
  console.log('\n  STEP 2: Log in as the PurposeJoy channel account.');
  console.log('          Review the permissions screen — scope is UPLOAD ONLY.');
  console.log('          Click Allow.\n');
  console.log('  STEP 3: Copy the authorization code shown.\n');

  const code = await ask('  Paste the authorization code here: ');
  if (!code) {
    console.error('❌  No code entered. Aborted.');
    process.exit(1);
  }

  console.log('\n  → Exchanging code for tokens…');
  const tokens = await exchangeCode(clientId, clientSec, code);

  const oauthData = {
    client_id:     clientId,
    client_secret: clientSec,
    redirect_uri:  REDIRECT_URI,
    scope:         SCOPE,
    refresh_token: tokens.refresh_token,
    access_token:  tokens.access_token,
    expiry_date:   Date.now() + (tokens.expires_in || 3600) * 1000,
    createdAt:     new Date().toISOString(),
  };

  fs.mkdirSync(SECRETS_DIR, { recursive: true });
  fs.writeFileSync(OAUTH_OUT, JSON.stringify(oauthData, null, 2) + '\n');

  console.log('\n  ✅  OAuth credentials saved to secrets/yt-oauth.json');
  console.log('      (gitignored — never commit this file)\n');
  console.log('  You can now run:');
  console.log('    npm run shorts:upload -- --file INGEST/shorts/approved/short-*.mp4\n');
}

main().catch(err => {
  console.error('\n❌  OAuth init failed:', err.message);
  process.exit(1);
});
