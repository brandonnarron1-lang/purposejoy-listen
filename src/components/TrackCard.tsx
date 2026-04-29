import { useState, useEffect, useRef } from 'react';
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
  const { currentSong, playing, play, togglePlay, seek, currentTime } = usePlayer();
  const [fullSong, setFullSong] = useState<Song>(song);

  // Scrubber drag state
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(0);

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

  // ── Scrubber pointer logic ──────────────────────────────────────────────
  const getPositionPct = (clientX: number): number => {
    const el = scrubberRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handleScrubStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCurrent) return;
    e.preventDefault();
    setIsDragging(true);
    const pct = getPositionPct(e.clientX);
    setDragPct(pct);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleScrubMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const pct = getPositionPct(e.clientX);
    setDragPct(pct);
  };

  const handleScrubEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const pct = getPositionPct(e.clientX);
    const seekTime = pct * (song.duration_seconds || 0);
    seek(seekTime);
    setIsDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };
  // ────────────────────────────────────────────────────────────────────────

  const displayPct = isDragging ? dragPct * 100 : progressPct;
  const displayTime = isDragging
    ? dragPct * (song.duration_seconds || 0)
    : currentTime;

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
              {/* Interactive scrubber with drag-to-seek */}
              <div
                className="track-card-scrubber"
                ref={scrubberRef}
                onPointerDown={handleScrubStart}
                onPointerMove={handleScrubMove}
                onPointerUp={handleScrubEnd}
                onPointerCancel={handleScrubEnd}
              >
                <div className="track-card-scrubber-track">
                  <div
                    className="track-card-scrubber-fill"
                    style={{
                      width: `${displayPct}%`,
                      transition: isDragging ? 'none' : undefined,
                    }}
                  />
                  <div
                    className={`track-card-scrubber-thumb${isDragging ? ' track-card-scrubber-thumb--dragging' : ''}`}
                    style={{
                      left: `${displayPct}%`,
                      transition: isDragging ? 'none' : undefined,
                    }}
                  />
                </div>
                <div className="track-card-times">
                  <span>{formatDuration(displayTime)}</span>
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
