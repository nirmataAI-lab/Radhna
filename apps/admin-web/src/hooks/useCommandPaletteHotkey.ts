import { useEffect } from 'react';

export function useCommandPaletteHotkey(open: boolean, setOpen: (value: boolean) => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isK = event.key === 'k' || event.key === 'K';
      if (isK && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);
}
