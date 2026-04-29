import { useState, useEffect } from 'react';
import type { Song } from '../types';
import AtmosphericBackground from '../components/AtmosphericBackground';
import HeroMasthead from '../components/HeroMasthead';
import TrackCard from '../components/TrackCard';
import SkeletonRow from '../components/SkeletonRow';

export function ListenHome() {
  const [songs, setSongs] = useState<Song[]>([]);
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

  const totalSeconds = songs.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const totalMin = Math.floor(totalSeconds / 60);

  return (
    <div className="listen-home">
      <AtmosphericBackground />

      <HeroMasthead trackCount={songs.length} totalMinutes={totalMin} />

      <main className="listen-main">
        {loading ? (
          <ol className="track-list">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}><SkeletonRow /></li>
            ))}
          </ol>
        ) : (
          <ol className="track-list">
            {songs.map((song, idx) => (
              <li key={song.id}>
                <TrackCard
                  song={song}
                  queue={songs}
                  trackNumber={idx + 1}
                />
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
