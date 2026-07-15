import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'chief-kds:item-checkoff:v1';

type CheckoffMap = Record<string, true>;

function read(): CheckoffMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckoffMap) : {};
  } catch {
    return {};
  }
}

function write(map: CheckoffMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Tracks which order-line-items a cook has already prepared.
 * Persisted in localStorage so refresh / reconnect keep progress.
 */
export function useItemCheckoff() {
  const [map, setMap] = useState<CheckoffMap>(() => read());

  useEffect(() => {
    write(map);
  }, [map]);

  const isChecked = useCallback((itemId: string) => !!map[itemId], [map]);

  const toggle = useCallback((itemId: string) => {
    setMap((prev) => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = true;
      return next;
    });
  }, []);

  const clear = useCallback((itemIds: string[]) => {
    setMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of itemIds) {
        if (next[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  return { isChecked, toggle, clear };
}
