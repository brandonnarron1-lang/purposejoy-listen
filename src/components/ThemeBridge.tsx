import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';

export default function ThemeBridge() {
  const { currentSong } = usePlayer();
  const { extractFromImage, resetToDefault } = useTheme();

  useEffect(() => {
    if (!currentSong) {
      resetToDefault();
      return;
    }
    if (currentSong.cover_r2_key) {
      extractFromImage(`/api/cover/${currentSong.cover_r2_key}`);
    }
  }, [currentSong?.slug, currentSong?.cover_r2_key, extractFromImage, resetToDefault]);

  return null;
}
