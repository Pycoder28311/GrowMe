import type { Plant } from '@growme/shared';

import { plantsApi } from '@/api/plants';
import { useApiItem, usePagedList } from '@/lib/use-api';

/** The plants list from the API, newest first, a page at a time */
export function usePlants() {
  const { items, ...rest } = usePagedList(plantsApi.list);
  return { plants: items, ...rest };
}

// The plants opened this session, so a plant's second page (its full lifecycle) shows at once
const opened = new Map<number, Plant>();

const fetchPlant = (id: number) =>
  plantsApi.get(id).then((plant) => {
    opened.set(id, plant);
    return plant;
  });

/**
 * One plant with its lifecycles, tips, diseases and combination. A plant opened before shows
 * right away (state 'ready') while it reloads.
 */
export function usePlant(id: number) {
  const { item, state, ...rest } = useApiItem(fetchPlant, id);
  const kept = state === 'loading' ? opened.get(id) : undefined;
  return { plant: item ?? kept ?? null, state: kept ? ('ready' as const) : state, ...rest };
}
