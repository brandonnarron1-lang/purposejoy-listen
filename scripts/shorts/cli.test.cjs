'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('real CLI runs inside an ES-module project and previews without credentials or source changes', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pj-cli-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const scripts = path.join(root, 'scripts/shorts');
  fs.mkdirSync(scripts, { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ type: 'module' }));
  for (const name of ['package.json', 'upload-short.js']) {
    fs.copyFileSync(path.join(__dirname, name), path.join(scripts, name));
  }
  const executable = path.join(scripts, 'upload-short.js');
  const help = execFileSync(process.execPath, [executable, '--help'], { cwd: root, encoding: 'utf8' });
  assert.match(help, /Check account only/);
  const approved = path.join(root, 'INGEST/shorts/approved');
  fs.mkdirSync(approved, { recursive: true });
  const media = path.join(approved, 'test.mp4');
  const bytes = Buffer.from('synthetic media fixture; no upload');
  fs.writeFileSync(media, bytes);
  const preview = execFileSync(process.execPath, [executable, '--file', media, '--title', 'Fixture title'], { cwd: root, encoding: 'utf8' });
  assert.match(preview, /DRY RUN/);
  assert.match(preview, /Fixture title/);
  assert.match(preview, /"privacyStatus": "private"/);
  assert.deepEqual(fs.readFileSync(media), bytes);
  assert.equal(fs.existsSync(path.join(root, 'secrets')), false);
  assert.equal(fs.existsSync(path.join(root, 'INGEST/shorts/uploaded')), false);
  assert.equal(fs.existsSync(path.join(root, 'INGEST/shorts/shorts-log.json')), false);
});
