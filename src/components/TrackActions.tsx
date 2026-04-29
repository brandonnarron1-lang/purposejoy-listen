import { useState } from 'react';

interface Props {
  song: {
    slug: string;
    title: string;
    download_enabled?: number;
    audio_r2_key?: string;
  };
  onLyricsFullscreen: () => void;
}

export default function TrackActions({ song, onLyricsFullscreen }: Props) {
  const [shareStatus, setShareStatus] = useState<string>('');

  const handleShare = async () => {
    const url = `${window.location.origin}/listen/${song.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `Listen to "${song.title}" on PurposeJoy`,
          url,
        });
      } catch {
        // User cancelled — silent
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus('Link copied');
        setTimeout(() => setShareStatus(''), 2000);
      } catch {
        setShareStatus('Copy failed');
        setTimeout(() => setShareStatus(''), 2000);
      }
    }
  };

  const handleDownload = () => {
    if (!song.audio_r2_key) return;
    const link = document.createElement('a');
    link.href = `/api/stream/${song.slug}`;
    link.download = `${song.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="track-actions">
      <button className="track-action-btn" onClick={handleShare} aria-label="Share track">
        <span className="track-action-icon" aria-hidden>↗</span>
        <span className="track-action-label">{shareStatus || 'Share'}</span>
      </button>

      <button className="track-action-btn" onClick={onLyricsFullscreen} aria-label="View lyrics fullscreen">
        <span className="track-action-icon" aria-hidden>♪</span>
        <span className="track-action-label">Lyrics</span>
      </button>

      {song.download_enabled === 1 && (
        <button className="track-action-btn" onClick={handleDownload} aria-label="Download track">
          <span className="track-action-icon" aria-hidden>↓</span>
          <span className="track-action-label">Download</span>
        </button>
      )}
    </div>
  );
}
