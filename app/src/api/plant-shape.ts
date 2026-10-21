import {
  EFFORT_LEVELS,
  flagDefault,
  parseDuration,
  PLANT_FLAG_KEYS,
  type Disease,
  type Lifecycle,
  type MonthRange,
  type Plant,
  type PlantSummary,
  type SearchPlant,
  type ToleranceLevel,
} from '@growme/shared';

// The plant API's answers in the app's types, whichever backend answers: the new one (plan 14) passes
// through, and the one deployed before it (sunStart/sunEnd, monthRanges, a 1–3 difficulty, wind, nearSea,
// frostHardy, a «4-6 years» lifespan, seed stages, one disease text, tips) is turned into the new fields the
// same way migration 0017 turns the stored rows. Fields missing from either become empty.

type Raw = Record<string, unknown>;

const num = (value: unknown) => (typeof value === 'number' ? value : null);
const str = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null);
const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const firstOf = <T>(...values: (T | null)[]) => values.find((value) => value !== null) ?? null;

/** The old 1–3 (or 1–5) difficulty as levels */
function difficultyLevels(raw: Raw) {
  if (Array.isArray(raw.difficultyLevels)) return list<(typeof EFFORT_LEVELS)[number]>(raw.difficultyLevels);
  const old = num(raw.difficulty);
  if (old === null) return [];
  return [old <= 1 ? 'small' : old === 2 ? 'medium' : 'big'] as const;
}

/** The old lifespan text («4-6 years», «6 months») in whole years, at least 1 */
function lifespanYears(raw: Raw): [number | null, number | null] {
  if ('lifespanMin' in raw) return [num(raw.lifespanMin), num(raw.lifespanMax)];
  const parsed = str(raw.lifespan) ? parseDuration(raw.lifespan as string) : null;
  if (!parsed) return [null, null];
  const perYear = { years: 1, months: 1 / 12, weeks: 1 / 52, days: 1 / 365 }[parsed.unit];
  const years = (n: number) => Math.max(1, Math.round(n * perYear));
  return [years(parsed.from), years(parsed.to ?? parsed.from)];
}

const OLD_WIND: Record<string, ToleranceLevel> = { strong: 'big', moderate: 'medium', light: 'small', sheltered: 'small' };

/** Everything a plant in lists and in the search index has, from either shape */
function commonFields(raw: Raw) {
  const [lifespanMin, lifespanMax] = lifespanYears(raw);
  const flags = Object.fromEntries(
    PLANT_FLAG_KEYS.map((key) => [key, typeof raw[key] === 'boolean' ? raw[key] : flagDefault(key)]),
  ) as Pick<PlantSummary, (typeof PLANT_FLAG_KEYS)[number]>;
  return {
    ...flags,
    lifespanMin,
    lifespanMax,
    potSizes: list<PlantSummary['potSizes'][number]>(raw.potSizes),
    difficultyLevels: [...difficultyLevels(raw)],
    timeNeeded: list<PlantSummary['timeNeeded'][number]>(raw.timeNeeded),
    toxicity: list<PlantSummary['toxicity'][number]>(raw.toxicity),
    frostTolerance: (str(raw.frostTolerance) as ToleranceLevel | null) ?? (raw.frostHardy === true ? 'big' : null),
    saltTolerance: (str(raw.saltTolerance) as ToleranceLevel | null) ?? (raw.nearSea === true ? 'big' : null),
    windTolerance: (str(raw.windTolerance) as ToleranceLevel | null) ?? OLD_WIND[str(raw.wind) ?? ''] ?? null,
    sunIntenseStart: firstOf(num(raw.sunIntenseStart), num(raw.sunStart)),
    sunIntenseEnd: firstOf(num(raw.sunIntenseEnd), num(raw.sunEnd)),
    sunSoftStart: num(raw.sunSoftStart),
    sunSoftEnd: num(raw.sunSoftEnd),
    seedingSeason: list<MonthRange>(raw.seedingSeason),
    plantingSeason: Array.isArray(raw.plantingSeason) ? list<MonthRange>(raw.plantingSeason) : list<MonthRange>(raw.monthRanges),
  };
}

/** A plant of a list (GET /plants) */
export const toPlantSummary = (raw: Raw): PlantSummary => ({
  ...commonFields(raw),
  id: num(raw.id) ?? 0,
  combinationId: num(raw.combinationId),
  family: str(raw.family),
  name: str(raw.name) ?? '',
  scientificName: str(raw.scientificName) ?? '',
  description: str(raw.description),
  native: str(raw.native),
  images: list<PlantSummary['images'][number]>(raw.images),
  createdAt: str(raw.createdAt) ?? '',
});

const toLifecycle = (raw: Raw): Lifecycle => ({
  id: num(raw.id) ?? 0,
  plantId: num(raw.plantId) ?? 0,
  position: num(raw.position) ?? 0,
  title: str(raw.title) ?? '',
  content: str(raw.content) ?? '',
  tab: (str(raw.tab) as Lifecycle['tab'] | null) ?? (raw.seed === true ? 'seed' : 'plant'),
  duration: str(raw.duration),
});

const toDisease = (raw: Raw): Disease => ({
  id: num(raw.id) ?? 0,
  plantId: num(raw.plantId) ?? 0,
  title: str(raw.title) ?? '',
  label: str(raw.label),
  symptoms: str(raw.symptoms),
  // The old single text is «Τι είναι»
  what: str(raw.what) ?? str(raw.content),
  action: str(raw.action),
});

/** One plant with everything (GET /plants/:id); the old tips have no place any more and are dropped */
export const toPlant = (raw: Raw): Plant => ({
  ...toPlantSummary(raw),
  trivia: str(raw.trivia),
  secret: str(raw.secret),
  combination: (raw.combination as Plant['combination']) ?? null,
  lifecycles: list<Raw>(raw.lifecycles).map(toLifecycle),
  diseases: list<Raw>(raw.diseases).map(toDisease),
});

/** A plant of the search index */
export const toSearchPlant = (raw: Raw): SearchPlant => ({
  ...commonFields(raw),
  id: num(raw.id) ?? 0,
  name: str(raw.name) ?? '',
  scientificName: str(raw.scientificName) ?? '',
  native: str(raw.native),
  image: str(raw.image),
});
