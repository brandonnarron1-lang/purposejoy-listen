import { useEffect, useState, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { haptic } from '../hooks/useHaptic';
import NowPlayingSheetContent from './NowPlayingSheetContent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  queue?: any[];
}

export default function NowPlayingSheet({ isOpen, onClose, queue = [] }: Props) {
  const { currentSong } = usePlayer();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setDragY(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientY - rect.top > 80) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartTime.current = Date.now();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY.current;
    setDragY(Math.max(0, delta));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dragDistance = dragY;
    const dragDuration = Date.now() - dragStartTime.current;
    const velocity = dragDistance / dragDuration;
    const dismissThreshold = window.innerHeight * 0.25;
    if (dragDistance > dismissThreshold || velocity > 0.6) {
      haptic('light'); // Phase 2: haptic on drag-dismiss
      onClose();
    } else {
      setDragY(0);
    }
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  if (!currentSong) return null;

  return (
    <>
      <div
        className={`nps-backdrop ${isOpen ? 'nps-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={sheetRef}
        className={`nps-sheet ${isOpen ? 'nps-sheet--open' : ''} ${isDragging ? 'nps-sheet--dragging' : ''}`}
        style={{
          transform: isOpen ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging ? 'none' : undefined,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Now Playing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="nps-handle" aria-hidden>
          <div className="nps-handle-bar" />
        </div>
        <div className="nps-content">
          <NowPlayingSheetContent queue={queue} />
        </div>
      </div>
    </>
  );
}
