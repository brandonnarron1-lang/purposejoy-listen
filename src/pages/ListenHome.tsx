import { useState, useEffect } from 'react';
import type { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import AtmosphericBackground from '../components/AtmosphericBackground';
import TrackCard from '../components/TrackCard';
import LyricsView from '../components/LyricsView';

export function ListenHome() {
  const { currentSong } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [fullscreenSlug, setFullscreenSlug] = useState<string | null>(null);
  const [fullscreenSong, setFullscreenSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/playlists/purposejoy')
      .then(r => r.json())
      .then(data => {
        setSongs(data.songs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // When fullscreen lyrics requested, fetch full song detail (with lyrics_timed)
  useEffect(() => {
    if (!fullscreenSlug) {
      setFullscreenSong(null);
      return;
    }
    fetch(`/api/songs/${fullscreenSlug}`)
      .then(r => r.json())
      .then(setFullscreenSong)
      .catch(() => setFullscreenSong(null));
  }, [fullscreenSlug]);

  const totalSeconds = songs.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const totalMin = Math.floor(totalSeconds / 60);

  const handleToggleExpand = (slug: string) => {
    setExpandedSlug(prev => (prev === slug ? null : slug));
  };

  const fallbackCover = songs[0]?.cover_r2_key
    ? `/api/cover/${songs[0].cover_r2_key}`
    : undefined;

  return (
    <div className="listen-home">
      <AtmosphericBackground fallbackCoverUrl={fallbackCover} />

      <header className="listen-hero">
        <img
          src="/brand/wordmark.png"
          alt="PurposeJoy"
          className="listen-hero-wordmark"
        />
        <p className="listen-hero-tagline">Live with purpose and joy.</p>
        <p className="listen-hero-meta">
          Mike Eatmon · {songs.length} originals · {totalMin} min
        </p>
      </header>

      <main className="listen-main">
        {loading ? (
          <div className="listen-loading">Loading...</div>
        ) : (
          <ol className="track-list">
            {songs.map((song, idx) => (
              <li key={song.id}>
                <TrackCard
                  song={song}
                  queue={songs}
                  trackNumber={idx + 1}
                  expanded={expandedSlug === song.slug}
                  onToggleExpand={() => handleToggleExpand(song.slug)}
                  onLyricsFullscreen={() => setFullscreenSlug(song.slug)}
                />
              </li>
            ))}
          </ol>
        )}
      </main>

      {/* Fullscreen lyrics overlay */}
      {fullscreenSlug && fullscreenSong && (
        <div className="lyrics-fullscreen-overlay">
          <LyricsView
            song={fullscreenSong}
            mode="fullscreen"
            onClose={() => setFullscreenSlug(null)}
          />
        </div>
      )}
    </div>
  );
}
