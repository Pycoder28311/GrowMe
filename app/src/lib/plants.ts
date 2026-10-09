import {
  PLANT_FLAG_KEYS,
  parseRichContent,
  plainTextOf,
  sunPart,
  type Plant,
  type PlantSummary,
  type SearchPlant,
} from '@growme/shared';
import { useEffect, useMemo, useState } from 'react';

import { plantsApi } from '@/api/plants';
import { useSearchIndex } from '@/lib/search';
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

const RELATED_MAX = 6;

/**
 * Plants like this one, from the search index: the same kind counts most, then each yes/no
 * characteristic both have, then the same part of the day for sun. Never the plant itself or `exclude`
 * (its combination's plants); only plants with something in common.
 */
export function relatedPlants(plant: PlantSummary, all: SearchPlant[], exclude: ReadonlySet<number>): SearchPlant[] {
  const part = plant.sunStart !== null && plant.sunEnd !== null ? sunPart(plant.sunStart, plant.sunEnd) : null;
  const score = (other: SearchPlant) =>
    (plant.kind && other.kind === plant.kind ? 3 : 0) +
    PLANT_FLAG_KEYS.filter((key) => plant[key] && other[key]).length +
    (part && other.sunStart !== null && other.sunEnd !== null && sunPart(other.sunStart, other.sunEnd) === part ? 1 : 0);
  return all
    .filter((other) => other.id !== plant.id && !exclude.has(other.id))
    .map((other) => ({ other, points: score(other) }))
    .filter(({ points }) => points > 0)
    .sort((a, b) => b.points - a.points || a.other.name.localeCompare(b.other.name, 'el'))
    .slice(0, RELATED_MAX)
    .map(({ other }) => other);
}

/** Related plants (the search index loads once per session) */
export function useRelatedPlants(plant: PlantSummary | null, exclude: readonly number[]): SearchPlant[] {
  const { index, load } = useSearchIndex();
  useEffect(() => load(), [load]);
  const excluded = exclude.join(',');
  return useMemo(() => {
    if (!plant || !index) return [];
    const skip = new Set(excluded ? excluded.split(',').map(Number) : []);
    return relatedPlants(plant, index.plants, skip);
  }, [plant, index, excluded]);
}
