import { useEffect, useState } from 'react';

/**
 * True for `ms` after `active` turns true, then false until it turns false and true again: a looping animation
 * plays for a while and then rests, so a screen left open stops redrawing (each frame is costly on phones).
 */
export function usePlayWindow(active: boolean, ms: number) {
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setEnded(true), ms);
    return () => {
      clearTimeout(timer);
      setEnded(false);
    };
  }, [active, ms]);
  return active && !ended;
}
