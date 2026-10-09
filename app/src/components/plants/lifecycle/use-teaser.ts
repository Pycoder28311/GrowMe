import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

/** Between two teasers (random within this range), and how long one stays */
const GAP_MS = [6000, 10000] as const;
const SHOWN_MS = 4000;

const randomGap = () => GAP_MS[0] + Math.random() * (GAP_MS[1] - GAP_MS[0]);

/**
 * Now and then, one random stage of a life cycle shows the first line of its text, to make the reader
 * curious: returns that stage's index, or null. Runs only while the page is on screen, with at least
 * two stages, and not with Reduce Motion.
 */
export function useTeaser(count: number, enabled = true) {
  const reduced = useReducedMotion();
  const [teased, setTeased] = useState<number | null>(null);
  const active = enabled && !reduced && count >= 2;

  useFocusEffect(
    useCallback(() => {
      if (!active) return;
      let timer: ReturnType<typeof setTimeout>;
      let last = -1;
      const show = () => {
        // Never the same stage twice in a row
        let next = Math.floor(Math.random() * (count - 1));
        if (next >= last && last >= 0) next += 1;
        last = next;
        setTeased(next);
        timer = setTimeout(hide, SHOWN_MS);
      };
      const hide = () => {
        setTeased(null);
        timer = setTimeout(show, randomGap());
      };
      timer = setTimeout(show, randomGap());
      return () => {
        clearTimeout(timer);
        setTeased(null);
      };
    }, [active, count]),
  );

  return active ? teased : null;
}
