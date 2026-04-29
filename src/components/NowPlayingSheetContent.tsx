import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import LyricsView from './LyricsView';
import TrackActions from './TrackActions';

export default function NowPlayingSheetContent() {
  const { currentSong, playing, play, pause, next, prev, seek, currentTime } = usePlayer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullSong, setFullSong] = useState<any>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(0);

  useEffect(() => {
    if (!currentSong) {
      setFullSong(null);
      return;
    }
    fetch(`/api/songs/${currentSong.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setFullSong(data); })
      .catch(() => {});
  }, [currentSong?.slug]);

  if (!currentSong) return null;

  const coverUrl = `/api/cover/${currentSong.cover_r2_key}`;
  const dur = currentSong.duration_seconds || 0;
  const progressPct = dur ? (currentTime / dur) * 100 : 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getPositionPct = (clientX: number): number => {
    const el = scrubberRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleScrubStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragPct(getPositionPct(e.clientX));
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleScrubMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    setDragPct(getPositionPct(e.clientX));
  };

  const handleScrubEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const pct = getPositionPct(e.clientX);
    seek(pct * dur);
    setIsDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  const handlePlayPause = () => {
    if (playing) pause();
    else play(currentSong);
  };

  return (
    <div className="nps-body">
      <div className="nps-cover-wrap">
        <div className="nps-cover-glow" aria-hidden />
        <img
          src={coverUrl}
          alt={`${currentSong.title} cover`}
          className={`nps-cover ${playing ? 'nps-cover--playing' : ''}`}
        />
      </div>

      <div className="nps-titles">
        <h2 className="nps-title">{currentSong.title}</h2>
        <p className="nps-artist">{currentSong.artist}</p>
      </div>

      <div
        className="nps-scrubber"
        ref={scrubberRef}
        onPointerDown={handleScrubStart}
        onPointerMove={handleScrubMove}
        onPointerUp={handleScrubEnd}
        onPointerCancel={handleScrubEnd}
      >
        <div className="nps-scrubber-track">
          <div
            className="nps-scrubber-fill"
            style={{
              width: `${isDragging ? dragPct * 100 : progressPct}%`,
              transition: isDragging ? 'none' : undefined,
            }}
          />
          <div
            className={`nps-scrubber-thumb ${isDragging ? 'nps-scrubber-thumb--dragging' : ''}`}
            style={{
              left: `${isDragging ? dragPct * 100 : progressPct}%`,
              transition: isDragging ? 'none' : undefined,
            }}
          />
        </div>
        <div className="nps-times">
          <span>{fmt(isDragging ? dragPct * dur : currentTime)}</span>
          <span>-{fmt(dur - (isDragging ? dragPct * dur : currentTime))}</span>
        </div>
      </div>

      <div className="nps-controls">
        <button className="nps-ctrl nps-ctrl--secondary" onClick={prev} aria-label="Previous">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/>
          </svg>
        </button>
        <button className="nps-ctrl nps-ctrl--primary" onClick={handlePlayPause} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1"/>
              <rect x="14" y="5" width="4" height="14" rx="1"/>
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        <button className="nps-ctrl nps-ctrl--secondary" onClick={next} aria-label="Next">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/>
          </svg>
        </button>
      </div>

      {/* Track actions — share, download (gated), YouTube (gated) */}
      {fullSong && (
        <div className="nps-actions-wrap">
          <TrackActions song={fullSong} />
        </div>
      )}

      {fullSong && (
        <div className="nps-lyrics-wrap">
          <LyricsView song={fullSong} mode="inline" />
        </div>
      )}

      <div className="nps-bottom-pad" aria-hidden />
    </div>
  );
}
