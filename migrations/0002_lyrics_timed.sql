-- PurposeJoy Listen — Add lyrics_timed and transcript_state to songs
-- Run with: npx wrangler d1 execute purposejoy_db --file=migrations/0002_lyrics_timed.sql
-- Local:    npx wrangler d1 execute purposejoy_db --local --file=migrations/0002_lyrics_timed.sql

ALTER TABLE songs ADD COLUMN lyrics_timed TEXT;
ALTER TABLE songs ADD COLUMN transcript_state TEXT DEFAULT 'stub';

-- Update existing rows to stub state
UPDATE songs SET transcript_state = 'stub' WHERE transcript_state IS NULL;
