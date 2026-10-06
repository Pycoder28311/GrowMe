import { plantsApi } from '@/api/plants';
import { useApiItem, usePagedList } from '@/lib/use-api';

/** The plants list from the API, newest first, a page at a time */
export function usePlants() {
  const { items, ...rest } = usePagedList(plantsApi.list);
  return { plants: items, ...rest };
}

/** One plant with its lifecycles, tips, diseases and combination */
export function usePlant(id: number) {
  const { item, ...rest } = useApiItem(plantsApi.get, id);
  return { plant: item, ...rest };
}
