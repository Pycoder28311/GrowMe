import { parseRichContent, plainTextOf, type Plant, type PlantSummary } from '@growme/shared';
import { useEffect, useMemo, useState } from 'react';

import { plantsApi } from '@/api/plants';
import { USE_MOCK_PLANTS } from '@/config/app';
import { MOCK_PLANTS, mockPlant } from '@/config/mock-plants';
import { useApiItem, usePagedList } from '@/lib/use-api';

/** The plants list from the API, newest first, a page at a time */
export function usePlants() {
  const { items, ...rest } = usePagedList(plantsApi.list);
  return { plants: items, ...rest };
}

// The plants opened this session, so a plant's second page (its full lifecycle) shows at once
const opened = new Map<number, Plant>();

// A plant's request started by a tap on a search result, so the page opening after the zoom uses it
// instead of sending its own (only while it is this fresh)
const started = new Map<number, { at: number; request: Promise<Plant> }>();
const STARTED_FRESH_MS = 20_000;

const fetchMockPlant = (id: number): Promise<Plant> => Promise.resolve(mockPlant(id));

const fetchPlant = (id: number) => {
  if (id < 0) return fetchMockPlant(id);
  const early = started.get(id);
  started.delete(id);
  if (early && Date.now() - early.at < STARTED_FRESH_MS) return early.request;
  return plantsApi.get(id).then((plant) => {
    opened.set(id, plant);
    return plant;
  });
};

/** Starts a plant's request now (the search result's tap), for the page to use when it opens */
export function prefetchPlant(id: number) {
  if (started.has(id)) return;
  const request = plantsApi.get(id).then((plant) => {
    opened.set(id, plant);
    return plant;
  });
  // A failed one is dropped: the page then asks on its own and shows its error and retry
  request.catch(() => started.delete(id));
  started.set(id, { at: Date.now(), request });
}

/**
 * One plant with its lifecycles, tips, diseases and combination. A plant opened before shows
 * right away (state 'ready') while it reloads.
 */
export function usePlant(id: number) {
  // The mockup: a plant of config/mock-plants.ts (negative ids always are), no request
  const { item, state, ...rest } = useApiItem(USE_MOCK_PLANTS ? fetchMockPlant : fetchPlant, id);
  const kept = state === 'loading' ? opened.get(id) : undefined;
  return { plant: item ?? kept ?? null, state: kept ? ('ready' as const) : state, ...rest };
}

/* ─────────────── Plant page carousels: its combination, related plants ─────────────── */

/** A small plant card in a carousel: photo, name, a line of text */
export type PlantCardItem = { id: number; name: string; text: string; image: string | null };

// The combinations loaded this session, so a plant opened again shows them at once
const combinationPlants = new Map<number, PlantSummary[]>();

/** The other plants of this plant's combination (none when it has no combination) */
export function useCombinationPlants(combinationId: number | null, exceptId: number): PlantCardItem[] {
  const [loaded, setLoaded] = useState<{ id: number; plants: PlantSummary[] } | null>(null);

  useEffect(() => {
    if (combinationId === null) return;
    let current = true;
    plantsApi
      .byCombination(combinationId)
      .then((page) => {
        combinationPlants.set(combinationId, page.items);
        if (current) setLoaded({ id: combinationId, plants: page.items });
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [combinationId]);

  return useMemo(() => {
    // The mockup: the other mock plants stand in for the combination
    if (USE_MOCK_PLANTS) {
      return MOCK_PLANTS.filter((plant) => plant.id !== exceptId).map((plant) => ({
        id: plant.id,
        name: plant.name,
        text: plant.scientificName,
        image: null,
      }));
    }
    if (combinationId === null) return [];
    const plants = loaded?.id === combinationId ? loaded.plants : (combinationPlants.get(combinationId) ?? []);
    return plants
      .filter((plant) => plant.id !== exceptId)
      .map((plant) => ({
        id: plant.id,
        name: plant.name,
        text: plant.description ? plainTextOf(parseRichContent(plant.description)) : plant.scientificName,
        image: plant.images[0]?.url ?? null,
      }));
  }, [combinationId, exceptId, loaded]);
}
