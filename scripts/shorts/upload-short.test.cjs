'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  parseArgs, buildMetadata, mergeRefreshedTokens, assertChannelMatch, validateUploadUrl, hasUploadReceipt, run
} = require('./upload-short.js');

const channelId = 'UC1111111111111111111111';
const otherId = 'UC2222222222222222222222';
const channelResult = id => ({ items: [{ id, snippet: { title: 'Synthetic test channel' } }] });
const file = { filename: 'short-test-hook0.mp4', size: 123, slug: 'test' };

function fixture(overrides = {}) {
  const calls = [];
  const messages = [];
  return {
    calls, messages,
    io: {
      inspectFile: () => { calls.push('inspect'); return file; },
      authorize: async () => { calls.push('authorize'); return { accessToken: 'fake-test-token', channel: { id: channelId, title: 'Test' } }; },
      confirm: async () => { calls.push('confirm'); return 'yes'; },
      upload: async (_info, metadata) => {
        calls.push('upload');
        assert.equal(metadata.status.privacyStatus, 'private');
        return { id: 'testVideo01', sha256: 'test-hash' };
      },
      recordUpload: async () => { calls.push('record'); },
      log: message => messages.push(message),
      ...overrides
    }
  };
}

test('defaults to local dry run and accepts channel check without media', () => {
  assert.equal(parseArgs(['--file', 'one.mp4']).upload, false);
  assert.equal(parseArgs(['--check-channel']).checkChannel, true);
  assert.equal(parseArgs([]).help, true);
});

test('rejects conflicting modes, unknown flags, multiple files and missing values', () => {
  for (const argv of [
    ['--upload', '--dry-run', '--file', 'one.mp4'],
    ['--dry-run', '--check-channel', '--file', 'one.mp4'],
    ['--public', '--file', 'one.mp4'],
    ['--file', 'one.mp4', 'two.mp4'],
    ['--file', '--upload'],
    ['--file', 'one.mp4', '--file', 'two.mp4'],
    ['--upload']
  ]) assert.throws(() => parseArgs(argv));
});

test('metadata always requests private visibility and preserves supplied copy', () => {
  const metadata = buildMetadata({ title: 'A title', desc: 'Description', tags: 'one, two,,' }, file);
  assert.equal(metadata.status.privacyStatus, 'private');
  assert.equal(metadata.snippet.title, 'A title');
  assert.equal(metadata.snippet.description, 'Description');
  assert.deepEqual(metadata.snippet.tags, ['one', 'two']);
  assert.throws(() => buildMetadata({ title: 'x'.repeat(101) }, file));
});

test('matches authorized channel against dynamically resolved handle', () => {
  assert.equal(assertChannelMatch(channelResult(channelId), channelResult(channelId)).id, channelId);
  assert.throws(() => assertChannelMatch(channelResult(channelId), channelResult(otherId)), /does not match/);
});

test('fails closed for empty, ambiguous, malformed or missing channel results', () => {
  const good = channelResult(channelId);
  for (const bad of [null, {}, { items: [] }, { items: [null] }, { items: [{ id: channelId }, { id: otherId }] }, { ...good, nextPageToken: 'more' }, channelResult(null), channelResult('not-a-channel-id')]) {
    assert.throws(() => assertChannelMatch(bad, good));
    assert.throws(() => assertChannelMatch(good, bad));
  }
});

test('refresh retains existing refresh token only when refreshing the same grant', () => {
  const old = { client_id: 'test-client', refresh_token: 'old-test-refresh', scope: 'old-scope', channel_id: channelId };
  const refreshed = mergeRefreshedTokens(old, { access_token: 'new-test-access', expires_in: 3600 });
  assert.equal(refreshed.refresh_token, 'old-test-refresh');
  assert.equal(refreshed.client_id, 'test-client');
  assert.equal(old.access_token, undefined);
  assert.ok(refreshed.expiry_date > Date.now());
  assert.equal(mergeRefreshedTokens(old, { access_token: 'new', refresh_token: 'rotated' }).refresh_token, 'rotated');
  assert.throws(() => mergeRefreshedTokens(old, {}));
  assert.throws(() => mergeRefreshedTokens({}, { access_token: 'new' }));
});

test('upload URL accepts Google HTTPS only without credentials or custom port', () => {
  assert.equal(validateUploadUrl('https://www.googleapis.com/upload/test'), 'https://www.googleapis.com/upload/test');
  for (const url of [
    undefined, 'not a url', 'http://www.googleapis.com/upload',
    'https://googleapis.com.evil.example/upload',
    'https://www.googleapis.com@evil.example/upload',
    'https://name:password@www.googleapis.com/upload',
    'https://www.googleapis.com:444/upload'
  ]) assert.throws(() => validateUploadUrl(url));
});

test('dry run never calls authorization, confirmation, upload or receipt writer', async () => {
  const f = fixture();
  assert.equal(await run(parseArgs(['--file', 'one.mp4']), f.io), 'preview');
  assert.deepEqual(f.calls, ['inspect']);
  assert.ok(f.messages.some(message => message.includes('DRY RUN')));
});

test('account check works without a file and never uploads', async () => {
  const f = fixture();
  assert.equal(await run(parseArgs(['--check-channel']), f.io), 'verified');
  assert.deepEqual(f.calls, ['authorize']);
});

test('channel mismatch or lookup failure stops before confirmation and upload', async () => {
  const f = fixture({ authorize: async () => { throw new Error('channel mismatch'); } });
  await assert.rejects(run(parseArgs(['--upload', '--file', 'one.mp4']), f.io), /channel mismatch/);
  assert.deepEqual(f.calls, ['inspect']);
});

test('declined confirmation does not upload', async () => {
  const f = fixture({ confirm: async () => 'no' });
  assert.equal(await run(parseArgs(['--upload', '--file', 'one.mp4']), f.io), 'aborted');
  assert.deepEqual(f.calls, ['inspect', 'authorize']);
});

test('upload occurs only after channel verification and confirmation; receipt follows', async () => {
  const f = fixture();
  assert.equal(await run(parseArgs(['--upload', '--file', 'one.mp4']), f.io), 'uploaded');
  assert.deepEqual(f.calls, ['inspect', 'authorize', 'confirm', 'upload', 'record']);
  assert.ok(f.messages.some(message => message.includes('Approved source preserved')));
  assert.ok(!f.messages.join('\n').includes('fake-test-token'));
});

test('upload failure does not write a receipt or retry', async () => {
  let attempts = 0;
  const f = fixture({ upload: async () => { attempts++; throw new Error('uncertain completion'); } });
  await assert.rejects(run(parseArgs(['--upload', '--file', 'one.mp4']), f.io), /uncertain completion/);
  assert.equal(attempts, 1);
  assert.ok(!f.calls.includes('record'));
});

test('receipt failure reports accepted video ID and explicitly forbids blind retry', async () => {
  const f = fixture({ recordUpload: async () => { throw new Error('disk full'); } });
  await assert.rejects(
    run(parseArgs(['--upload', '--file', 'one.mp4']), f.io),
    /Video testVideo01 was accepted.*Do not upload again/
  );
  assert.equal(f.calls.filter(call => call === 'upload').length, 1);
  assert.ok(f.messages.some(message => message.includes('https://studio.youtube.com/video/testVideo01/edit')));
});

test('durable per-video receipt prevents a duplicate when the aggregate log write was lost', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pj-receipt-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'testVideo01.json'), JSON.stringify({
    videoId: 'testVideo01', sha256: 'fixture-hash', channelId
  }));
  assert.equal(hasUploadReceipt('fixture-hash', channelId, [], directory), true);
  assert.equal(hasUploadReceipt('other-hash', channelId, [], directory), false);
  assert.equal(hasUploadReceipt('fixture-hash', otherId, [], directory), false);
});

test('an unreadable durable receipt blocks another upload until it is reconciled', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pj-receipt-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'testVideo01.json'), '{truncated');
  assert.throws(() => hasUploadReceipt('fixture-hash', channelId, [], directory), /receipt is unreadable/);
});
