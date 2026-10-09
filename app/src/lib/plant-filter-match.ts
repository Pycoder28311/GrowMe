import { FILTERS, type FilterId, type FilterPlant, type Filters, type LinkedOption } from '@/config/plant-filters';

// Applies the chosen filters (config/plant-filters.ts) to the search index's plants, on the phone.
// Across filters every one must match; inside a filter any chosen option is enough. A plant with no
// value for a filter (no sun window, no size…) doesn't match it.

/** The filters that have something chosen */
export const activeFilters = (filters: Filters): FilterId[] =>
  (Object.keys(FILTERS) as FilterId[]).filter((id) => (filters[id]?.length ?? 0) > 0);

/** How many options are chosen in all */
export const chosenCount = (filters: Filters) =>
  Object.values(filters).reduce((total, chosen) => total + (chosen?.length ?? 0), 0);

/** Whether a plant passes one filter: any of its chosen options */
export function matchesFilter(plant: FilterPlant, id: FilterId, chosen: readonly string[]) {
  return FILTERS[id].options.some((option) => chosen.includes(option.id) && option.test(plant));
}

export type RelatedPlant<T> = { plant: T; matched: number };

/**
 * The plants that pass every active filter (in their order), and below them the related ones: those
 * passing some but not all, most matched first (then by name). With no active filter, all match.
 */
export function matchPlantFilters<T extends FilterPlant>(plants: readonly T[], filters: Filters) {
  const active = activeFilters(filters);
  const matches: T[] = [];
  const related: RelatedPlant<T>[] = [];
  for (const plant of plants) {
    const matched = active.filter((id) => matchesFilter(plant, id, filters[id]!)).length;
    if (matched === active.length) matches.push(plant);
    else if (matched > 0) related.push({ plant, matched });
  }
  related.sort((a, b) => b.matched - a.matched || a.plant.name.localeCompare(b.plant.name, 'el'));
  return { matches, related, activeCount: active.length };
}

/* ─────────────── Changing a selection ─────────────── */

/** Chooses or un-chooses an option; a single-choice filter keeps only the new one */
export function toggleOption(filters: Filters, id: FilterId, optionId: string): Filters {
  const chosen = filters[id] ?? [];
  const on = chosen.includes(optionId);
  const next = on ? chosen.filter((o) => o !== optionId) : FILTERS[id].select === 'one' ? [optionId] : [...chosen, optionId];
  return { ...filters, [id]: next };
}

/** A linked checkbox is checked when all its options are chosen */
export const linkedChecked = (filters: Filters, link: LinkedOption) =>
  link.values.every((value) => filters[link.filter]?.includes(value) ?? false);

/** Checks a linked checkbox (chooses all its options) or unchecks it (removes them) */
export function toggleLinked(filters: Filters, link: LinkedOption): Filters {
  const chosen = filters[link.filter] ?? [];
  const next = linkedChecked(filters, link)
    ? chosen.filter((value) => !link.values.includes(value))
    : [...chosen, ...link.values.filter((value) => !chosen.includes(value))];
  return { ...filters, [link.filter]: next };
}

/* ─────────────── The price chart ─────────────── */

/** How many plants are sold at each whole euro, up to the dearest (for the price histogram) */
export function priceCounts(plants: readonly FilterPlant[]) {
  const ranges = plants.flatMap((plant) => {
    const low = plant.priceMin ?? plant.priceMax;
    const high = plant.priceMax ?? plant.priceMin;
    return low === null || high === null ? [] : [[low / 100, high / 100] as const];
  });
  const max = Math.max(1, Math.ceil(Math.max(0, ...ranges.map(([, high]) => high))));
  const counts = Array.from({ length: max }, (_, euro) => ranges.filter(([low, high]) => low < euro + 1 && high >= euro).length);
  return { counts, max };
}
