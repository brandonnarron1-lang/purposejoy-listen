import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useSheet } from '../context/SheetContext';

interface SongSummary {
  id: string;
  slug: string;
  title: string;
  artist: string;
  cover_r2_key?: string;
  duration_seconds?: number;
  download_enabled?: number;
  audio_r2_key?: string;
}

interface Props {
  song: SongSummary;
  queue: SongSummary[];
  trackNumber: number;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackCard({ song, queue, trackNumber }: Props) {
  const { currentSong, playing, play, pause, cachedSlugs } = usePlayer();
  const isCached = cachedSlugs?.has(song.slug) ?? false;
  const { open: openSheet } = useSheet();

  const isCurrent = currentSong?.slug === song.slug;
  const coverUrl = song.cover_r2_key ? `/api/cover/${song.cover_r2_key}` : '/brand/wordmark.png';

  const handleRowClick = () => {
    if (!isCurrent) {
      play(song as any, queue as any);
    }
    openSheet();
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent && playing) {
      pause();
    } else {
      play(song as any, queue as any);
    }
  };

  return (
    <article className={`track-card ${isCurrent ? 'track-card--current' : ''}`}>
      <div
        className="track-card-row"
        onClick={handleRowClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
          }
        }}
      >
        <div className="track-card-number">
          {isCurrent && playing ? (
            <span className="track-card-eq" aria-label="Now playing">
              <span /><span /><span />
            </span>
          ) : (
            trackNumber
          )}
        </div>
        <img
          src={coverUrl}
          alt={`${song.title} cover`}
          className="track-card-thumb"
          loading="lazy"
        />
        <div className="track-card-meta">
          {isCurrent && <div className="track-card-eyebrow">NOW PLAYING</div>}
          <div className="track-card-title">
            {song.title}
            {isCached && <span className="track-card-cached-badge" aria-label="Available offline">✓</span>}
          </div>
          <div className="track-card-duration">{formatDuration(song.duration_seconds)}</div>
        </div>
        <button
          className="track-card-play"
          onClick={handlePlayPause}
          aria-label={isCurrent && playing ? 'Pause' : 'Play'}
        >
          {isCurrent && playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1"/>
              <rect x="14" y="5" width="4" height="14" rx="1"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>
    </article>
  );
}
