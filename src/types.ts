export interface Song {
  id: string
  slug: string
  title: string
  artist: string
  album?: string
  description?: string
  lyrics?: string
  audio_r2_key: string
  cover_r2_key?: string
  duration_seconds?: number
  release_date?: string
  sort_order: number
  published: number
  download_enabled: number
  lyrics_timed?: string | null
  transcript_state?: string
  created_at: string
  updated_at: string
}

export interface Playlist {
  id: string
  slug: string
  title: string
  description?: string
  cover_r2_key?: string
  published: number
  songs?: Song[]
  created_at: string
  updated_at: string
}

export interface PlaylistItem {
  playlist_id: string
  song_id: string
  track_order: number
}

export interface AppEvent {
  id?: number
  song_id?: string
  playlist_id?: string
  event_type: 'play' | 'complete' | 'download' | 'share' | 'admin_upload' | 'admin_publish'
  source?: string
  user_agent?: string
  created_at?: string
}

export interface SongStats {
  song_id: string
  title: string
  plays: number
  downloads: number
  shares: number
}
