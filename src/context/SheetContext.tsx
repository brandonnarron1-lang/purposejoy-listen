import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface MorphRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SheetContextValue {
  isOpen: boolean;
  open: (sourceRect?: MorphRect) => void;
  close: () => void;
  toggle: () => void;
  morphSource: MorphRect | null;
  clearMorph: () => void;
}

const SheetContext = createContext<SheetContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  morphSource: null,
  clearMorph: () => {},
});

export const useSheet = () => useContext(SheetContext);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [morphSource, setMorphSource] = useState<MorphRect | null>(null);

  const open = useCallback((sourceRect?: MorphRect) => {
    const doOpen = () => {
      if (sourceRect) setMorphSource(sourceRect);
      setIsOpen(true);
    };
    if ('startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(doOpen);
    } else {
      doOpen();
    }
  }, []);

  const close = useCallback(() => {
    const doClose = () => {
      setIsOpen(false);
      setMorphSource(null);
    };
    if ('startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(doClose);
    } else {
      doClose();
    }
  }, []);

  const toggle = useCallback(() => {
    if ('startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => setIsOpen((v) => !v));
    } else {
      setIsOpen((v) => !v);
    }
  }, []);
  const clearMorph = useCallback(() => setMorphSource(null), []);

  return (
    <SheetContext.Provider value={{ isOpen, open, close, toggle, morphSource, clearMorph }}>
      {children}
    </SheetContext.Provider>
  );
}
