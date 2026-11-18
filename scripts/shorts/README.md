# PurposeJoy — direct YouTube Shorts workflow

Reuse an approved MP4 and the existing Google project. These scripts do not deploy the website or require a social scheduling service. All uploads are private; final review and scheduling remain in YouTube Studio.

## What to run first

Use Node.js 24 (the version tested in CI). The upload and authorization tools use only Node built-ins; no npm install is required for them. Existing composition tools still require their documented media inputs and ffmpeg.

Place one reviewed MP4 inside `INGEST/shorts/approved/`. Use an exact filename, not a wildcard. The directory and file must resolve inside that approved directory after following symlinks.

```sh
npm run shorts:upload -- --file "INGEST/shorts/approved/example.mp4" --title "Your final title" --desc "Your final description"
```

This defaults to a local preview: no credentials are read, no network request is made, and no files are changed. Supply the final platform copy and disclosure from the release packet; the generic defaults are not a finished release.

## Verify the existing authorization

```sh
npm run shorts:upload -- --check-channel
```

This refreshes the local token and uses read-only YouTube requests to compare the authorized channel with the current channel resolved from `@PurposeJoy`. It does not upload anything. A missing, ambiguous or different channel stops the process. The historical channel ID and a Google login email are not used as substitutes for that check.

If the existing credentials work, no new sign-in is required. If authorization is absent, expired or lacks the read-only scope, use the initializer below on the Mac.

## Repair or renew Google sign-in on the Mac

Keep the existing Google project and its original downloaded **Desktop-app** client JSON at `secrets/google-oauth-client.json`. It must contain the `installed` object; this initializer does not reinterpret a web client as a desktop client. Locate the existing project/client before considering a new one.

```sh
npm run shorts:oauth
```

Open the printed Google URL in a browser on the **same Mac** running this command. A phone browser cannot complete this local callback. Select the account/channel that owns PurposeJoy. The requested scopes are `youtube.upload` and `youtube.readonly`; read-only access is used to verify the destination channel. The flow uses a loopback callback, PKCE and state validation instead of copying authorization codes.

The existing `secrets/yt-oauth.json` remains in place until a complete token response and the correct channel are verified. A successful replacement saves a restricted backup and keeps the existing flat token-file format. Tokens and backups stay under the ignored `secrets/` directory. Run one initializer/uploader at a time; these files are not a multi-process queue.

## Upload one reviewed video privately

```sh
npm run shorts:upload -- --file "INGEST/shorts/approved/example.mp4" --title "Your final title" --desc "Your final description" --tags "PurposeJoy,Shorts" --upload
```

The script verifies the channel, displays the metadata and asks for `yes` in an interactive terminal. It streams the MP4 to YouTube with explicit private visibility. The approved original stays in place. Successful uploads receive a per-video JSON receipt in `INGEST/shorts/uploaded/` and an entry in `INGEST/shorts/shorts-log.json`.

Open the returned YouTube Studio URL to review playback, audience, synthetic-media disclosure, captions, thumbnail and the final publishing time. This repair does not implement unattended publication or a background scheduler. The old queue JSON remains a scaffold.

If the response is uncertain, or YouTube accepted the video but the local receipt failed, check YouTube Studio before retrying. The script does not retry uploads automatically. Duplicate checks read both the summary log and the per-video receipts, so a saved receipt still protects against a repeated file if the summary update failed. Unreadable receipts require reconciliation. This is not a distributed deduplication system.

## Existing media production tools

The earlier hook/composition tools remain available when needed:

```sh
npm run shorts:identify
npm run shorts:compose -- --hook "INGEST/shorts/pending/hooks-example.json" --index 0 --audio "/path/to/master.wav"
```

Reuse finished approved videos rather than regenerating them. Preserve original master audio and editable source; no media downloader is required.

## Validation

```sh
node --test scripts/shorts/*.test.cjs
```

Tests cover the actual CLI under the repository's ES-module root, default preview behavior, channel mismatches, private-only requests, upload failure handling, loopback callbacks and token-file preservation. Google requests and uploads are not exercised by CI; live channel verification and a controlled private upload are separate acceptance checks on the Mac.
