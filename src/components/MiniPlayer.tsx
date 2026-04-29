import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useSheet } from '../context/SheetContext';

export default function MiniPlayer() {
  const { currentSong, playing, play, pause, currentTime } = usePlayer();
  const { open } = useSheet();

  if (!currentSong) return null;

  const coverUrl = `/api/cover/${currentSong.cover_r2_key}`;
  const progressPct = currentSong.duration_seconds
    ? (currentTime / currentSong.duration_seconds) * 100
    : 0;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) {
      pause();
    } else {
      play(currentSong);
    }
  };

  return (
    <div
      className="mini-player"
      onClick={open}
      role="button"
      tabIndex={0}
      aria-label={`Now playing: ${currentSong.title}. Tap to open full player.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="mini-player-progress" aria-hidden>
        <div
          className="mini-player-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="mini-player-content">
        <img
          src={coverUrl}
          alt=""
          className={`mini-player-cover ${playing ? 'mini-player-cover--playing' : ''}`}
        />
        <div className="mini-player-meta">
          <div className="mini-player-title">{currentSong.title}</div>
          <div className="mini-player-artist">{currentSong.artist}</div>
        </div>
        <button
          className="mini-player-playpause"
          onClick={handlePlayPause}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="mini-player-chevron" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
