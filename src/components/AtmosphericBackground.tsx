import { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';

export default function AtmosphericBackground() {
  const { currentSong } = usePlayer();
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    // Subtle glow shift when track changes
    setGlowIntensity(0);
    const t = setTimeout(() => setGlowIntensity(currentSong ? 1 : 0), 50);
    return () => clearTimeout(t);
  }, [currentSong?.slug]);

  return (
    <div
      className="atmospheric-glow"
      style={{ opacity: 0.4 + glowIntensity * 0.3 }}
      aria-hidden
    />
  );
}
