import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Re-renders every second while `active`. Durations are derived from timestamps, so a paused
 *  interval in the background never causes drift: the next tick recomputes from the wall clock. */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') setNow(Date.now()); });
    return () => { clearInterval(id); sub.remove(); };
  }, [active, intervalMs]);
  return active ? now : Date.now();
}
