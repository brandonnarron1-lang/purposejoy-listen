'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateTokens, verifyChannel, saveAtomically, receiveCode } = require('./oauth-init.js');

const fixture = {
  access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600,
  scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
};
test('initial authorization requires both tokens and both scopes', () => {
  assert.doesNotThrow(() => validateTokens(fixture));
  assert.throws(() => validateTokens({ ...fixture, refresh_token: undefined }), /both tokens/);
  assert.throws(() => validateTokens({ ...fixture, scope: 'https://www.googleapis.com/auth/youtube.upload' }), /permissions/);
  assert.throws(() => validateTokens({ ...fixture, expires_in: 'bad' }), /expiry/);
});
test('channel check rejects wrong, absent, ambiguous or paginated identity', () => {
  const target = { items: [{ id: 'UC1111111111111111111111' }] };
  assert.equal(verifyChannel(target, target), 'UC1111111111111111111111');
  for (const mine of [
    { items: [{ id: 'UC2222222222222222222222' }] }, { items: [] }, { items: [null] }, { items: [{ id: 'malformed' }] },
    { items: [{ id: 'UC1111111111111111111111' }, { id: 'UC2222222222222222222222' }] },
    { ...target, nextPageToken: 'fixture-next-page' },
  ]) assert.throws(() => verifyChannel(mine, target), /does not match/);
});
test('callback ignores wrong state/path and accepts one valid code', async t => {
  const callback = await receiveCode('fixture-state', 3000);
  t.after(() => callback.cancel());
  let result = await fetch(callback.redirectUri + '?state=wrong&code=fixture-code');
  assert.equal(result.status, 400);
  await result.text();
  result = await fetch(callback.redirectUri + 'other?state=fixture-state&code=fixture-code');
  assert.equal(result.status, 404);
  await result.text();
  result = await fetch(callback.redirectUri + '?state=fixture-state&code=fixture-code');
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(result.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(await callback.code, 'fixture-code');
  assert.doesNotMatch(await result.text(), /fixture-code/);
});
test('callback handles access denial without logging Google text', async t => {
  const callback = await receiveCode('fixture-state', 3000);
  t.after(() => callback.cancel());
  const rejected = assert.rejects(callback.code, /authorization was denied/);
  const result = await fetch(callback.redirectUri + '?state=fixture-state&error=access_denied&error_description=fixture-secret');
  assert.equal(result.status, 400);
  assert.doesNotMatch(await result.text(), /fixture-secret/);
  await rejected;
});
test('callback rejects missing or duplicate authorization code', async t => {
  for (const suffix of ['', '&code=one&code=two']) {
    const callback = await receiveCode('fixture-state', 3000);
    t.after(() => callback.cancel());
    const rejected = assert.rejects(callback.code, /no authorization code/);
    const result = await fetch(callback.redirectUri + '?state=fixture-state' + suffix);
    assert.equal(result.status, 400);
    await result.text();
    await rejected;
  }
});
test('callback closes after timeout and explicit cancellation', async () => {
  const timed = await receiveCode('fixture-state', 20);
  await assert.rejects(timed.code, /timed out/);
  const cancelled = await receiveCode('fixture-state', 3000);
  const rejected = assert.rejects(cancelled.code, /cancelled/);
  cancelled.cancel();
  await rejected;
});
test('atomic save keeps a restricted backup and rejects changed originals', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pj-oauth-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'yt-oauth.json');
  const original = JSON.stringify({ refresh_token: 'fixture-original' });
  fs.writeFileSync(file, original);
  saveAtomically(file, { refresh_token: 'fixture-new' }, original);
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).refresh_token, 'fixture-new');
  const backup = fs.readdirSync(directory).find(name => name.endsWith('.bak'));
  assert.ok(backup);
  assert.equal(fs.readFileSync(path.join(directory, backup), 'utf8'), original);
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    assert.equal(fs.statSync(path.join(directory, backup)).mode & 0o777, 0o600);
  }
  const saved = fs.readFileSync(file, 'utf8');
  assert.throws(() => saveAtomically(file, { refresh_token: 'fixture-overwrite' }, original), /changed during sign-in/);
  assert.equal(fs.readFileSync(file, 'utf8'), saved);
  assert.equal(fs.readdirSync(directory).filter(name => name.endsWith('.tmp')).length, 0);
});
