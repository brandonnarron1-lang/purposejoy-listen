import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useSheet } from '../context/SheetContext';
import { useAudioAmplitude } from '../hooks/useAudioAmplitude';
import { haptic } from '../hooks/useHaptic';
import LyricsView from './LyricsView';
import LyricShareCard from './LyricShareCard';
import TrackActions from './TrackActions';
import QueueView from './QueueView';

interface Props {
  queue?: any[]; // SongSummary[]
}

export default function NowPlayingSheetContent({ queue = [] }: Props) {
  const { currentSong, playing, play, pause, next, prev, seek, currentTime } = usePlayer();
  const { isOpen, morphSource, clearMorph } = useSheet();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullSong, setFullSong] = useState<any>(null);
  const [shareCardLine, setShareCardLine] = useState<string | null>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(0);
  const [morphStyle, setMorphStyle] = useState<React.CSSProperties>({});

  // Phase 1: audio amplitude for breathing cover
  const amplitude = useAudioAmplitude({ enabled: isOpen });

  // Full song detail fetch
  useEffect(() => {
    if (!currentSong) { setFullSong(null); return; }
    fetch(`/api/songs/${currentSong.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setFullSong(data); })
      .catch(() => {});
  }, [currentSong?.slug]);

  // Phase 4: FLIP morph from mini-player cover position
  useLayoutEffect(() => {
    if (!morphSource || !heroRef.current) {
      setMorphStyle({});
      return;
    }
    const target = heroRef.current.getBoundingClientRect();
    const dx = morphSource.x - target.left;
    const dy = morphSource.y - target.top;
    const scale = morphSource.width / target.width;

    // First frame: snap to source position
    setMorphStyle({
      transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
      transformOrigin: 'top left',
      transition: 'none',
      willChange: 'transform',
    });

    // Next frame: animate to natural position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMorphStyle({
          transform: 'translate(0, 0) scale(1)',
          transformOrigin: 'top left',
          transition: 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        });
      });
    });

    // Clear morph state after animation completes
    const t = setTimeout(() => {
      setMorphStyle({});
      clearMorph();
    }, 520);
    return () => clearTimeout(t);
  }, [morphSource, clearMorph]);

  if (!currentSong) return null;

  const coverUrl = currentSong.cover_r2_key
    ? `/api/cover/${currentSong.cover_r2_key}`
    : '/brand/wordmark.png';
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
    haptic('light'); // Phase 2
    const pct = getPositionPct(e.clientX);
    seek(pct * dur);
    setIsDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  const handlePlayPause = () => {
    haptic('medium'); // Phase 2
    if (playing) pause();
    else play(currentSong);
  };

  return (
    <div className="nps-pages">
      {/* Page 1: Now Playing */}
      <div className="nps-page nps-page--now-playing">
        <div className="nps-body">
          {/* Phase 1: amplitude CSS var on cover + glow; Phase 4: morph ref */}
          <div
            className="nps-cover-wrap"
            ref={heroRef}
            style={morphStyle}
          >
            <div
              className="nps-cover-glow"
              style={{ '--amplitude': amplitude.toFixed(3) } as React.CSSProperties}
              aria-hidden
            />
            <img
              src={coverUrl}
              alt={`${currentSong.title} cover`}
              className={`nps-cover vt-cover-art ${playing ? 'nps-cover--playing' : ''}`}
              style={{ '--amplitude': amplitude.toFixed(3) } as React.CSSProperties}
            />
          </div>

          <div className="nps-titles">
            <p className="eyebrow">Now Playing</p>
            <h2 className="nps-title">{currentSong.title}</h2>
            <p className="nps-artist credit">{currentSong.artist}</p>
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
            <button
              className="nps-ctrl nps-ctrl--secondary"
              onClick={() => { haptic('change'); prev(); }} // Phase 2
              aria-label="Previous"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/>
              </svg>
            </button>
            <button
              className="nps-ctrl nps-ctrl--primary"
              onClick={handlePlayPause}
              aria-label={playing ? 'Pause' : 'Play'}
            >
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
            <button
              className="nps-ctrl nps-ctrl--secondary"
              onClick={() => { haptic('change'); next(); }} // Phase 2
              aria-label="Next"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/>
              </svg>
            </button>
          </div>

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

          {/* Gap-fill: Share current lyric line as image card */}
          {fullSong?.lyrics_timed && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
              <button
                onClick={() => {
                  // Extract active line from parsed lyrics_timed
                  try {
                    const parsed = JSON.parse(fullSong.lyrics_timed)
                    const lines: { text: string; start: number; end: number }[] = parsed.lines || []
                    let activeLine = ''
                    for (let i = lines.length - 1; i >= 0; i--) {
                      if (currentTime >= lines[i].start) { activeLine = lines[i].text; break }
                    }
                    setShareCardLine(activeLine || lines[0]?.text || '')
                  } catch { /* no-op */ }
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-head)', fontSize: 10, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--pj-muted)',
                  padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                }}
                aria-label="Share current lyric"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
                </svg>
                Share lyric
              </button>
            </div>
          )}

          <div className="nps-bottom-pad" aria-hidden />
        </div>
      </div>

      {/* Page 2: Queue — swipe left to reveal */}
      <div className="nps-page nps-page--queue">
        <QueueView queue={queue} />
      </div>

      {/* Gap-fill: Lyric share card overlay */}
      {shareCardLine !== null && (
        <LyricShareCard
          lyricText={shareCardLine}
          onClose={() => setShareCardLine(null)}
        />
      )}
    </div>
  );
}
