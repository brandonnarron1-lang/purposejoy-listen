# Handoff Pointer — purposejoy-listen

This repo is part of the PurposeJoy ecosystem (Listen PWA at listen.purposejoy.org).

**For project state, history, conventions, and next actions — read this first:**
```
~/Desktop/Agent_Comms/PROJECT_RESUME.md
```

**For reusable technical skills (R2 ingest, D1 insert, Whisper, deploys, gates):**
```
~/Desktop/Agent_Comms/skills/
```

**For forward-looking feature directives (lyric sharing, email capture, Capacitor):**
```
~/Desktop/Agent_Comms/feature-scaffolds/
```

**For project-execution conventions (how this project was built):**
```
~/Desktop/Agent_Comms/skills/10_purposejoy-meta-skill/SKILL.md
```

## Quick Context

- Stack: Cloudflare Pages + D1 (purposejoy_db) + R2 (purposejoy-media) + Workbox PWA
- Auth: none (public listen page)
- Deploy: `npx wrangler pages deploy dist --project-name=purposejoy-listen`
- D1 execute: `npx wrangler d1 execute purposejoy_db --remote --command="SELECT ..."`
- Current state: 14 tracks live, all download_enabled=1, GA4 wired

## Absolute Rules for This Repo

- DO NOT run `npm install` without `NODE_ENV=development` prefix
- DO NOT run bare `wrangler` — always use `npx wrangler`
- DO NOT execute non-SELECT D1 statements without operator approval
- DO NOT change download_enabled without Mike's explicit per-track approval

Last updated: 2026-05-02
