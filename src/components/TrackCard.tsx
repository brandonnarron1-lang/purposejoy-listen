import { useState, useEffect } from 'react';
import type { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import LyricsView from './LyricsView';
import TrackActions from './TrackActions';

interface Props {
  song: Song;
  queue: Song[];
  expanded: boolean;
  onToggleExpand: () => void;
  onLyricsFullscreen: () => void;
  trackNumber: number;
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackCard({
  song,
  queue,
  expanded,
  onToggleExpand,
  onLyricsFullscreen,
  trackNumber,
}: Props) {
  const { currentSong, playing, play, togglePlay, currentTime } = usePlayer();
  const [fullSong, setFullSong] = useState<Song>(song);

  const isCurrent = currentSong?.slug === song.slug;

  // Lazy-load full song detail (with lyrics_timed) when card first expands
  useEffect(() => {
    if (expanded && !fullSong.lyrics_timed && !fullSong.lyrics) {
      fetch(`/api/songs/${song.slug}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => { if (data) setFullSong(data); })
        .catch(() => {});
    }
  }, [expanded, fullSong.lyrics_timed, fullSong.lyrics, song.slug]);

  const handlePlayPause = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      play(song, queue);
    }
  };

  const coverUrl = song.cover_r2_key
    ? `/api/cover/${song.cover_r2_key}`
    : '/brand/logo-warm.png';

  const progressPct =
    isCurrent && song.duration_seconds
      ? (currentTime / song.duration_seconds) * 100
      : 0;

  return (
    <article
      className={`track-card${expanded ? ' track-card--expanded' : ''}${isCurrent ? ' track-card--current' : ''}`}
    >
      {/* COLLAPSED ROW */}
      <div
        className="track-card-row"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()}
        aria-expanded={expanded}
      >
        <div className="track-card-number">{trackNumber}</div>
        <img
          src={coverUrl}
          alt={`${song.title} cover`}
          className="track-card-thumb"
          loading="lazy"
        />
        <div className="track-card-meta">
          {isCurrent && <div className="track-card-eyebrow">NOW PLAYING</div>}
          <div className="track-card-title">{song.title}</div>
          <div className="track-card-duration">{formatDuration(song.duration_seconds)}</div>
        </div>
        <button
          className="track-card-play"
          onClick={e => { e.stopPropagation(); handlePlayPause(); }}
          aria-label={isCurrent && playing ? 'Pause' : 'Play'}
        >
          {isCurrent && playing ? '❙❙' : '▶'}
        </button>
        <div className="track-card-chevron" aria-hidden>
          {expanded ? '▾' : '▸'}
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <div className="track-card-expand">
        <div className="track-card-expand-inner">
          <img
            src={coverUrl}
            alt=""
            className="track-card-hero-cover"
          />

          {isCurrent && (
            <div className="track-card-controls">
              <div className="track-card-scrubber">
                <div className="track-card-scrubber-track">
                  <div
                    className="track-card-scrubber-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="track-card-times">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(song.duration_seconds)}</span>
                </div>
              </div>
            </div>
          )}

          <LyricsView song={fullSong} mode="inline" />

          <TrackActions
            song={fullSong}
            onLyricsFullscreen={onLyricsFullscreen}
          />
        </div>
      </div>
    </article>
  );
}
