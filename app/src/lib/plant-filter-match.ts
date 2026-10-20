import {
  filtersFor,
  type FilterPlant,
  type PlantFilter,
  type Range,
  type SectionId,
  type Selection,
} from '@/config/section-filters';

// Applies the chosen filters (config/section-filters.ts) to the search index's plants, on the phone.
// Across filters every one must match; inside a chip filter any chosen option is enough. A plant with no
// value for a filter (no sun bar, no pot size…) doesn't match it. No React Native code here.

const isRange = (value: readonly string[] | Range | undefined, filter: PlantFilter): value is Range =>
  filter.kind === 'range' && value !== undefined;

const chosenOf = (selection: Selection, filter: PlantFilter) => (selection[filter.key] ?? []) as readonly string[];

/** Whether something is chosen in a filter (a bar moved from its ends counts as chosen) */
export function isActive(filter: PlantFilter, selection: Selection) {
  const value = selection[filter.key];
  if (filter.kind === 'range') return isRange(value, filter) && (value[0] !== filter.min || value[1] !== filter.max);
  return chosenOf(selection, filter).length > 0;
}

/** The filters of a section that have something chosen */
export const activeFilters = (selection: Selection, section: SectionId) =>
  filtersFor(section).filter((filter) => isActive(filter, selection));

/** How many filters of a section are chosen (a full sun bar doesn't count) */
export const chosenCount = (selection: Selection, section: SectionId) => activeFilters(selection, section).length;

/** Whether a plant passes one (active) filter */
export function matchesFilter(plant: FilterPlant, filter: PlantFilter, selection: Selection) {
  if (filter.kind === 'range') return filter.test(plant, selection[filter.key] as Range);
  const chosen = chosenOf(selection, filter);
  return filter.options.some((option) => chosen.includes(option.id) && option.test(plant));
}

export type RelatedPlant<T> = { plant: T; matched: number };

/**
 * The plants that pass every active filter of the section (in their order), and below them the related
 * ones: those passing some but not all, most matched first (then by name). With nothing chosen, all match.
 */
export function matchPlantFilters<T extends FilterPlant>(plants: readonly T[], selection: Selection, section: SectionId) {
  const active = activeFilters(selection, section);
  const matches: T[] = [];
  const related: RelatedPlant<T>[] = [];
  for (const plant of plants) {
    const matched = active.filter((filter) => matchesFilter(plant, filter, selection)).length;
    if (matched === active.length) matches.push(plant);
    else if (matched > 0) related.push({ plant, matched });
  }
  related.sort((a, b) => b.matched - a.matched || a.plant.name.localeCompare(b.plant.name, 'el'));
  return { matches, related, activeCount: active.length };
}

/* ─────────────── Changing a selection ─────────────── */

/**
 * Switches one option on or off, keeping the filter's rules: a single choice keeps only the new one, an
 * exclusive option drops the others (and the others drop it), and `clears` empties the filters it names.
 */
export function toggleOption(selection: Selection, filter: PlantFilter, optionId: string): Selection {
  if (filter.kind !== 'chips') return selection;
  const chosen = chosenOf(selection, filter);
  if (chosen.includes(optionId)) return { ...selection, [filter.key]: chosen.filter((id) => id !== optionId) };

  let next: string[];
  if (filter.select === 'one') next = [optionId];
  else if (filter.exclusive) {
    next = optionId === filter.exclusive ? [optionId] : [...chosen.filter((id) => id !== filter.exclusive), optionId];
  } else next = [...chosen, optionId];

  const result: Selection = { ...selection, [filter.key]: next };
  for (const other of filter.clears ?? []) result[other] = [];
  return result;
}

/** Stores a bar's range */
export const setRange = (selection: Selection, filter: PlantFilter, range: Range): Selection => ({
  ...selection,
  [filter.key]: range,
});
