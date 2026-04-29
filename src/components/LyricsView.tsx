import { useEffect, useRef, useState, useMemo } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface Word {
  word: string;
  start: number;
  end: number;
}

interface Line {
  text: string;
  start: number;
  end: number;
}

interface LyricsTimed {
  words: Word[];
  lines: Line[];
  duration: number;
  plain_text: string;
}

interface Props {
  song: {
    slug: string;
    lyrics_timed?: string | null;
    lyrics?: string | null;
    transcript_state?: string;
  };
  mode?: 'inline' | 'fullscreen';
  onClose?: () => void;
}

export default function LyricsView({ song, mode = 'inline', onClose }: Props) {
  const { currentSong, currentTime, playing } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(-1);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);

  const isCurrentTrack = currentSong?.slug === song.slug;

  const parsed = useMemo<LyricsTimed | null>(() => {
    if (!song.lyrics_timed) return null;
    try {
      return JSON.parse(song.lyrics_timed);
    } catch {
      return null;
    }
  }, [song.lyrics_timed]);

  // Find active line and word based on currentTime
  useEffect(() => {
    if (!parsed || !isCurrentTrack) {
      setActiveLineIdx(-1);
      setActiveWordIdx(-1);
      return;
    }

    let lineIdx = -1;
    for (let i = parsed.lines.length - 1; i >= 0; i--) {
      if (currentTime >= parsed.lines[i].start) {
        lineIdx = i;
        break;
      }
    }
    setActiveLineIdx(lineIdx);

    let wordIdx = -1;
    for (let i = parsed.words.length - 1; i >= 0; i--) {
      if (currentTime >= parsed.words[i].start) {
        wordIdx = i;
        break;
      }
    }
    setActiveWordIdx(wordIdx);
  }, [currentTime, parsed, isCurrentTrack]);

  // Auto-scroll active line into view
  useEffect(() => {
    if (activeLineIdx < 0 || !isCurrentTrack || !playing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lineEl = activeLineRef.current;
    if (!lineEl) return;
    lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLineIdx, isCurrentTrack, playing]);

  // No transcript available
  if (!parsed) {
    if (song.lyrics) {
      return (
        <div className={`lyrics-view lyrics-view--${mode} lyrics-view--static`}>
          {mode === 'fullscreen' && onClose && (
            <button className="lyrics-close" onClick={onClose} aria-label="Close lyrics">×</button>
          )}
          <pre className="lyrics-plain">{song.lyrics}</pre>
          <p className="lyrics-pending-note">Word-timed transcript not available for this track.</p>
        </div>
      );
    }
    return (
      <div className={`lyrics-view lyrics-view--${mode} lyrics-view--empty`}>
        {mode === 'fullscreen' && onClose && (
          <button className="lyrics-close" onClick={onClose} aria-label="Close lyrics">×</button>
        )}
        <p className="lyrics-pending-note">Lyrics not yet available.</p>
      </div>
    );
  }

  // Compute per-line word ranges for active-word highlighting
  const wordRanges = useMemo(() => {
    if (!parsed) return [];
    const ranges: { lineIdx: number; words: Word[] }[] = [];
    let wordCursor = 0;

    for (let i = 0; i < parsed.lines.length; i++) {
      const line = parsed.lines[i];
      const lineWords: Word[] = [];
      while (
        wordCursor < parsed.words.length &&
        parsed.words[wordCursor].start < line.end + 0.05
      ) {
        if (parsed.words[wordCursor].start >= line.start - 0.05) {
          lineWords.push(parsed.words[wordCursor]);
        }
        wordCursor++;
      }
      ranges.push({ lineIdx: i, words: lineWords });
    }
    return ranges;
  }, [parsed]);

  return (
    <div className={`lyrics-view lyrics-view--${mode}`} ref={containerRef}>
      {mode === 'fullscreen' && onClose && (
        <button className="lyrics-close" onClick={onClose} aria-label="Close lyrics">×</button>
      )}

      <div className="lyrics-scroll">
        {parsed.lines.map((line, idx) => {
          const isActive = idx === activeLineIdx;
          const isPast = idx < activeLineIdx;
          const lineWords = wordRanges[idx]?.words || [];

          return (
            <div
              key={idx}
              ref={isActive ? activeLineRef : null}
              className={`lyrics-line${isActive ? ' lyrics-line--active' : ''}${isPast ? ' lyrics-line--past' : ''}`}
            >
              {isActive && isCurrentTrack && lineWords.length > 0 ? (
                lineWords.map((w, wi) => {
                  const globalIdx = parsed.words.indexOf(w);
                  const isActiveWord = globalIdx === activeWordIdx;
                  return (
                    <span
                      key={wi}
                      className={`lyrics-word${isActiveWord ? ' lyrics-word--active' : ''}`}
                    >
                      {w.word}{' '}
                    </span>
                  );
                })
              ) : (
                line.text
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
