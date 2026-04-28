-- PurposeJoy Listen — Initial Schema
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'PurposeJoy',
  album TEXT,
  description TEXT,
  lyrics TEXT,
  audio_r2_key TEXT NOT NULL,
  cover_r2_key TEXT,
  duration_seconds INTEGER,
  release_date TEXT,
  sort_order INTEGER DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  download_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_r2_key TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_items (
  playlist_id TEXT NOT NULL,
  song_id TEXT NOT NULL,
  track_order INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id TEXT,
  playlist_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('play','complete','download','share','admin_upload','admin_publish')),
  source TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_songs_published_sort ON songs(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_events_song_type ON events(song_id, event_type);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON playlist_items(playlist_id, track_order);

-- Seed default playlist
INSERT INTO playlists (id, slug, title, description, published)
VALUES ('pl_main', 'purposejoy', 'PurposeJoy', 'The official PurposeJoy playlist — Live With Purpose And Joy.', 1)
ON CONFLICT(id) DO NOTHING;
