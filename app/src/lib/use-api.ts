import type { Page } from '@growme/shared';
import { useEffect, useRef, useState } from 'react';

// Loading state for API lists and items, shared by every screen that shows data from the backend.
// The fetch functions must be stable (module-level, e.g. plantsApi.list), not created during render.

/**
 * A list from the API, a page at a time: `loadMore` fetches the next page (when there is one),
 * `refresh` starts again from the first page.
 */
export function usePagedList<T>(fetchPage: (cursor: string | null) => Promise<Page<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const busy = useRef(true); // the first page starts loading right away

  const apply = (cursor: string | null, page: Page<T>) => {
    setItems((current) => (cursor ? [...current, ...page.items] : page.items));
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
    fetchPage(null)
      .then((page) => {
        if (!current) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        busy.current = false;
        setLoading(false);
      })
      .catch(() => {
        if (!current) return;
        busy.current = false;
        setError(true);
        setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [fetchPage]);

  /** A later page (cursor) or the first again (null); ignored while another load runs */
  const load = async (cursor: string | null) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      apply(cursor, await fetchPage(cursor));
      settle(false);
    } catch {
      settle(true);
    }
  };

  return {
    items,
    loading,
    error,
    hasMore: nextCursor !== null,
    loadMore: () => {
      if (nextCursor) load(nextCursor);
    },
    refresh: () => load(null),
    /** Changes the loaded items in place (e.g. add a new reply, bump a count) */
    update: (change: (items: T[]) => T[]) => setItems(change),
  };
}

/** One item from the API by id; `item` is set once `state` is 'ready' */
export function useApiItem<T>(fetchItem: (id: number) => Promise<T>, id: number) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; item: T | null } | null>(null);
  // A result belongs to one id and attempt; until it arrives, the plant is loading
  const key = `${id}:${attempt}`;

  useEffect(() => {
    let current = true;
    fetchItem(id)
      .then((item) => current && setResult({ key, item }))
      .catch(() => current && setResult({ key, item: null }));
    return () => {
      current = false;
    };
  }, [fetchItem, id, key]);

  const state = result?.key !== key ? 'loading' : result.item ? 'ready' : 'error';
  return {
    item: result?.key === key ? result.item : null,
    state,
    retry: () => setAttempt((n) => n + 1),
    /** Changes the loaded item in place (e.g. bump its reply count) */
    update: (change: (item: T) => T) =>
      setResult((current) => (current?.item ? { ...current, item: change(current.item) } : current)),
  } as const;
}
