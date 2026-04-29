import { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface Props {
  fallbackCoverUrl?: string;
}

export default function AtmosphericBackground({ fallbackCoverUrl }: Props) {
  const { currentSong } = usePlayer();
  const [bgUrl, setBgUrl] = useState<string>('');
  const [prevBgUrl, setPrevBgUrl] = useState<string>('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const newUrl = currentSong?.cover_r2_key
      ? `/api/cover/${currentSong.cover_r2_key}`
      : fallbackCoverUrl || '';

    if (newUrl && newUrl !== bgUrl) {
      setPrevBgUrl(bgUrl);
      setTransitioning(true);

      const img = new Image();
      img.onload = () => {
        setBgUrl(newUrl);
        setTimeout(() => {
          setPrevBgUrl('');
          setTransitioning(false);
        }, 500);
      };
      img.onerror = () => {
        setBgUrl('');
        setPrevBgUrl('');
        setTransitioning(false);
      };
      img.src = newUrl;
    }
  }, [currentSong?.cover_r2_key, fallbackCoverUrl]);

  return (
    <>
      {/* Previous layer — fading out */}
      {prevBgUrl && (
        <div
          className="atmospheric-bg-layer"
          style={{
            backgroundImage: `url(${prevBgUrl})`,
            opacity: transitioning ? 0 : 1,
          }}
          aria-hidden
        />
      )}
      {/* Current layer — fading in */}
      {bgUrl && (
        <div
          className="atmospheric-bg-layer"
          style={{
            backgroundImage: `url(${bgUrl})`,
            opacity: 1,
          }}
          aria-hidden
        />
      )}
      {/* Gradient overlay for legibility */}
      <div className="atmospheric-bg-overlay" aria-hidden />
      {/* Fallback gradient mesh if no image */}
      {!bgUrl && !prevBgUrl && (
        <div className="atmospheric-bg-fallback" aria-hidden />
      )}
    </>
  );
}
