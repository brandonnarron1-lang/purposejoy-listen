import { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface SongDetail {
  slug: string;
  title: string;
  artist: string;
  audio_r2_key?: string;
  download_enabled?: number;
  youtube_url?: string | null;
}

interface Props {
  song: SongDetail;
}

export default function TrackActions({ song }: Props) {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [cacheState, setCacheState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { cachedSlugs, refreshCacheState } = usePlayer();
  const isCached = cachedSlugs.has(song.slug);

  const shareUrl = `${window.location.origin}/listen/${song.slug}`;
  const shareTitle = `${song.title} — ${song.artist}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Listen to ${song.title} by ${song.artist}`,
          url: shareUrl,
        });
        setShareState('shared');
        setTimeout(() => setShareState('idle'), 2000);
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      window.prompt('Copy this link:', shareUrl);
    }
  };

  const handleSaveOffline = async () => {
    if (isCached) {
      try {
        const cache = await caches.open('audio-cache');
        await cache.delete(`/api/stream/${song.slug}`);
        refreshCacheState();
      } catch {
        // silently ignore
      }
      return;
    }
    setCacheState('saving');
    try {
      const resp = await fetch(`/api/stream/${song.slug}`);
      if (resp.ok) {
        const cache = await caches.open('audio-cache');
        await cache.put(`/api/stream/${song.slug}`, resp.clone());
        refreshCacheState();
        // Also precache cover art so MediaSession artwork shows on lock screen offline
        try {
          const coverKey = (song as any).cover_r2_key;
          if (coverKey) {
            const coverResp = await fetch(`/api/cover/${coverKey}`);
            if (coverResp.ok) {
              const coverCache = await caches.open('cover-art-cache');
              await coverCache.put(`/api/cover/${coverKey}`, coverResp.clone());
            }
          }
        } catch {
          // non-blocking — cover cache failure is ok
        }
        setCacheState('saved');
      } else {
        setCacheState('error');
        setTimeout(() => setCacheState('idle'), 3000);
      }
    } catch {
      setCacheState('error');
      setTimeout(() => setCacheState('idle'), 3000);
    }
  };

  const handleDownload = () => {
    const url = `/api/stream/${song.slug}?download=1`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title} — ${song.artist}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleYoutube = () => {
    if (!song.youtube_url) return;
    window.open(song.youtube_url, '_blank', 'noopener,noreferrer');
  };

  const downloadAvailable = song.download_enabled === 1;
  const youtubeAvailable = !!song.youtube_url;

  return (
    <div className="track-actions">
      <button
        className="track-action-btn"
        onClick={handleShare}
        aria-label="Share this track"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
        </svg>
        <span>{shareState === 'copied' ? 'Copied' : shareState === 'shared' ? 'Shared' : 'Share'}</span>
      </button>

      <button
        className={`track-action-btn${isCached ? ' track-action-btn--cached' : ''}`}
        onClick={handleSaveOffline}
        aria-label={isCached ? 'Remove from offline' : 'Save for offline'}
      >
        <span className="track-action-icon" aria-hidden>
          {cacheState === 'saving' ? '…' : isCached ? '✓' : '⤓'}
        </span>
        <span className="track-action-label">
          {cacheState === 'saving' ? 'Saving…'
            : cacheState === 'error' ? 'Try again'
            : isCached ? 'Saved'
            : 'Offline'}
        </span>
      </button>

      {downloadAvailable && (
        <button
          className="track-action-btn"
          onClick={handleDownload}
          aria-label="Download this track"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          <span>Download</span>
        </button>
      )}

      {youtubeAvailable && (
        <button
          className="track-action-btn track-action-btn--youtube"
          onClick={handleYoutube}
          aria-label="Watch the music video on YouTube"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L15.5 12 10 15.464z"/>
          </svg>
          <span>Watch Video</span>
        </button>
      )}
    </div>
  );
}
