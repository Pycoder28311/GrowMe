import type { Page, Plant, PlantSummary } from '@growme/shared';

import { toPlant, toPlantSummary } from './plant-shape';
import { request } from './client';

type Raw = Record<string, unknown>;

/** A page of plants in the app's types (plant-shape.ts reads the old and the new backend alike) */
const summaries = (page: Page<Raw>): Page<PlantSummary> => ({ ...page, items: page.items.map(toPlantSummary) });

/** Plants written in the admin dashboard (public: no sign-in needed) */
export const plantsApi = {
  /** 20 plants per call, newest first; pass the previous page's nextCursor to get the next 20 */
  list: (cursor?: string | null) =>
    request<Page<Raw>>(`/plants?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`).then(summaries),
  /** The plants of one combination (up to 50) */
  byCombination: (combinationId: number) =>
    request<Page<Raw>>(`/plants?limit=50&combinationId=${combinationId}`).then(summaries),
  /** One plant with its lifecycles, diseases and combination */
  get: (id: number): Promise<Plant> => request<Raw>(`/plants/${id}`).then(toPlant),
};
