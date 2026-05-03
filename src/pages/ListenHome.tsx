import { useState, useEffect, useCallback } from 'react';
import type { Song } from '../types';
import AtmosphericBackground from '../components/AtmosphericBackground';
import HeroMasthead from '../components/HeroMasthead';
import TrackCard from '../components/TrackCard';
import SkeletonRow from '../components/SkeletonRow';
import SubscribeModal, { shouldShowSubscribeModal } from '../components/SubscribeModal';

// Show modal after this many track-ended events (1 = after first full listen)
const MODAL_TRIGGER_COUNT = 1;

export function ListenHome() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [footerModalOpen, setFooterModalOpen] = useState(false);
  const [tracksEnded, setTracksEnded] = useState(0);

  useEffect(() => {
    fetch('/api/playlists/purposejoy')
      .then(r => r.json())
      .then(data => {
        setSongs(data.songs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Listen for track-ended events from PlayerContext
  const handleTrackEnded = useCallback(() => {
    setTracksEnded(prev => {
      const next = prev + 1;
      if (next >= MODAL_TRIGGER_COUNT && shouldShowSubscribeModal()) {
        setModalOpen(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('purposejoy:track-ended', handleTrackEnded);
    return () => window.removeEventListener('purposejoy:track-ended', handleTrackEnded);
  }, [handleTrackEnded]);

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

        <footer className="listen-footer">
          <button
            className="subscribe-footer-link"
            onClick={() => setFooterModalOpen(true)}
            aria-label="Get notified when new music drops"
          >
            Get notified when new music drops
          </button>
        </footer>
      </main>

      <SubscribeModal
        open={modalOpen}
        source="modal"
        onClose={() => setModalOpen(false)}
      />
      <SubscribeModal
        open={footerModalOpen}
        source="footer"
        onClose={() => setFooterModalOpen(false)}
      />
    </div>
  );
}
