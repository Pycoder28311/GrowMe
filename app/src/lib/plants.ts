import type { Page, Plant, PlantSummary } from '@growme/shared';
import { useEffect, useRef, useState } from 'react';

import { plantsApi } from '@/api/plants';

/**
 * The plants list from the API, a page at a time: `loadMore` fetches the next page (when there is one),
 * `refresh` starts again from the first page.
 */
export function usePlants() {
  const [plants, setPlants] = useState<PlantSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const busy = useRef(true); // the first page starts loading right away

  const apply = (cursor: string | null, page: Page<PlantSummary>) => {
    setPlants((current) => (cursor ? [...current, ...page.items] : page.items));
    setNextCursor(page.nextCursor);
  };

  const settle = (failed: boolean) => {
    busy.current = false;
    setError(failed);
    setLoading(false);
  };

  // First page when the screen opens
  useEffect(() => {
    let current = true;
    plantsApi
      .list(null)
      .then((page) => {
        if (!current) return;
        apply(null, page);
        settle(false);
      })
      .catch(() => {
        if (current) settle(true);
      });
    return () => {
      current = false;
    };
  }, []);

  /** A later page (cursor) or the first again (null); ignored while another load runs */
  const load = async (cursor: string | null) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      apply(cursor, await plantsApi.list(cursor));
      settle(false);
    } catch {
      settle(true);
    }
  };

  return {
    plants,
    loading,
    error,
    hasMore: nextCursor !== null,
    loadMore: () => {
      if (nextCursor) load(nextCursor);
    },
    refresh: () => load(null),
  };
}

type PlantResult = { key: string; plant: Plant | null };

/** One plant with everything about it; `plant` is set once `state` is 'ready' */
export function usePlant(id: number) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<PlantResult | null>(null);
  // A result belongs to one id and attempt; until it arrives, the plant is loading
  const key = `${id}:${attempt}`;

  useEffect(() => {
    let current = true;
    plantsApi
      .get(id)
      .then((plant) => current && setResult({ key, plant }))
      .catch(() => current && setResult({ key, plant: null }));
    return () => {
      current = false;
    };
  }, [id, key]);

  const state = result?.key !== key ? 'loading' : result.plant ? 'ready' : 'error';
  return { plant: result?.key === key ? result.plant : null, state, retry: () => setAttempt((n) => n + 1) } as const;
}
