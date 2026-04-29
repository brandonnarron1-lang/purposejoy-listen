import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SheetContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const SheetContext = createContext<SheetContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const useSheet = () => useContext(SheetContext);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);

  return (
    <SheetContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </SheetContext.Provider>
  );
}
