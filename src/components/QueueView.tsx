import { usePlayer } from '../context/PlayerContext';
import { haptic } from '../hooks/useHaptic';

interface SongSummary {
  id: string;
  slug: string;
  title: string;
  artist: string;
  cover_r2_key?: string;
  duration_seconds?: number;
}

interface Props {
  queue: SongSummary[];
}

function fmt(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QueueView({ queue }: Props) {
  const { currentSong, play } = usePlayer();
  const currentIdx = queue.findIndex((s) => s.slug === currentSong?.slug);
  const upcoming = currentIdx >= 0 ? queue.slice(currentIdx + 1) : queue;

  const handleTap = (song: SongSummary) => {
    haptic('light');
    play(song as any, queue as any);
  };

  return (
    <div className="queue-view">
      <h3 className="queue-view-heading">Up Next</h3>
      {upcoming.length === 0 ? (
        <p className="queue-view-empty">End of queue</p>
      ) : (
        <ol className="queue-view-list">
          {upcoming.map((song, idx) => (
            <li key={song.slug} className="queue-view-item" onClick={() => handleTap(song)}>
              <span className="queue-view-num">{idx + 1}</span>
              <img
                src={song.cover_r2_key ? `/api/cover/${song.cover_r2_key}` : '/brand/wordmark.png'}
                alt=""
                className="queue-view-thumb"
                loading="lazy"
              />
              <div className="queue-view-meta">
                <div className="queue-view-title">{song.title}</div>
                <div className="queue-view-artist">{song.artist}</div>
              </div>
              <div className="queue-view-duration">{fmt(song.duration_seconds)}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
