import type { SearchIndex } from '@growme/shared';
import { useCallback, useState } from 'react';

import { searchApi } from '@/api/search';

// The top-right search: one small index of every plant and blog, loaded when the search first opens
// and filtered on the phone as the user types (matchSearch in lib/search-match.ts).

const STALE_MS = 5 * 60 * 1000;

// Kept for the whole session: every open after the first is instant (reloaded when 5 minutes old)
let cached: { index: SearchIndex; at: number } | null = null;

/** The search index: `load()` on open fetches it unless a fresh one is kept */
export function useSearchIndex() {
  const [index, setIndex] = useState<SearchIndex | null>(cached?.index ?? null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (cached && Date.now() - cached.at < STALE_MS) {
      setIndex(cached.index);
      return;
    }
    setError(false);
    searchApi
      .index()
      .then((fresh) => {
        cached = { index: fresh, at: Date.now() };
        setIndex(fresh);
      })
      .catch(() => setError(true));
  }, []);

  return { index, error, load };
}
