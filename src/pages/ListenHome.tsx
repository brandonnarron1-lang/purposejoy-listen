import { useState, useEffect, useCallback, useRef } from 'react';
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
  const tracksEndedRef = useRef(0);

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
    tracksEndedRef.current += 1;
    if (tracksEndedRef.current >= MODAL_TRIGGER_COUNT && shouldShowSubscribeModal()) {
      setModalOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('purposejoy:track-ended', handleTrackEnded);
    return () => window.removeEventListener('purposejoy:track-ended', handleTrackEnded);
  }, [handleTrackEnded]);

  const totalSeconds = songs.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const totalMin = Math.floor(totalSeconds / 60);

  return (
    <div className="listen-home grain">
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
          <ol className="track-list" data-pj-sequence>
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
          <nav className="flex flex-wrap gap-3 items-center justify-center mt-6 credit" aria-label="Site">
            <a href="/privacy">Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms">Terms</a>
            <span aria-hidden="true">·</span>
            <a href="mailto:mike@ourtownproperties.com">Contact</a>
            <span aria-hidden="true">·</span>
            <span>© {new Date().getFullYear()} Mike Eatmon</span>
          </nav>
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
