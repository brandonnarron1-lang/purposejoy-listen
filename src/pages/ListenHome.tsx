import { useState, useEffect, useCallback, useRef } from 'react';
import type { Song } from '../types';
import AtmosphericBackground from '../components/AtmosphericBackground';
import HeroMasthead from '../components/HeroMasthead';
import TrackCard from '../components/TrackCard';
import SkeletonRow from '../components/SkeletonRow';
import SubscribeModal, { shouldShowSubscribeModal } from '../components/SubscribeModal';

// Show modal after this many track-ended events (1 = after first full listen)
const MODAL_TRIGGER_COUNT = 1;

/** Read the build-time seed injected by prerender-seed.mjs, if present. */
function readSeed(): Song[] | null {
  try {
    const el = document.getElementById('pj-seed');
    if (!el) return null;
    const data = JSON.parse(el.textContent || '');
    if (Array.isArray(data?.songs) && data.songs.length > 0) return data.songs as Song[];
  } catch {
    // Malformed seed — fall through to network fetch
  }
  return null;
}

export function ListenHome() {
  const seedSongs = readSeed();
  const [songs, setSongs] = useState<Song[]>(seedSongs ?? []);
  const [loading, setLoading] = useState(seedSongs === null);
  const [modalOpen, setModalOpen] = useState(false);
  const [footerModalOpen, setFooterModalOpen] = useState(false);
  const tracksEndedRef = useRef(0);

  useEffect(() => {
    // Skip network fetch when build-time seed already populated songs
    if (seedSongs !== null) return;
    fetch('/api/playlists/purposejoy')
      .then(r => r.json())
      .then(data => {
        setSongs(data.songs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
