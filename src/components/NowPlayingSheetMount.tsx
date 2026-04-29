import { useState, useEffect } from 'react';
import NowPlayingSheet from './NowPlayingSheet';
import { useSheet } from '../context/SheetContext';
import { usePlayer } from '../context/PlayerContext';

export default function NowPlayingSheetMount() {
  const { isOpen, close } = useSheet();
  const { currentSong } = usePlayer();
  const [queue, setQueue] = useState<any[]>([]);

  // Fetch playlist when sheet opens or track changes — powers queue view
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/playlists/purposejoy')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.songs) setQueue(data.songs); })
      .catch(() => {});
  }, [isOpen, currentSong?.slug]);

  return <NowPlayingSheet isOpen={isOpen} onClose={close} queue={queue} />;
}
