import { useEffect, useState, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NowPlayingSheet({ isOpen, onClose }: Props) {
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
          <div className="nps-shell-placeholder">
            <p style={{ textAlign: 'center', opacity: 0.6, fontSize: '0.875rem', padding: '2rem' }}>
              Now Playing: {currentSong.title}
            </p>
            <p style={{ textAlign: 'center', opacity: 0.4, fontSize: '0.75rem', padding: '0 2rem 2rem' }}>
              (Sheet content arriving in Stage B2)
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
