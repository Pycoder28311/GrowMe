import type { Page, Plant, PlantSummary } from '@growme/shared';
import { request } from './client';

/** Plants written in the admin dashboard (public: no sign-in needed) */
export const plantsApi = {
  /** 20 plants per call, newest first; pass the previous page's nextCursor to get the next 20 */
  list: (cursor?: string | null) =>
    request<Page<PlantSummary>>(`/plants?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
  /** One plant with its lifecycles, tips, diseases and combination */
  get: (id: number) => request<Plant>(`/plants/${id}`),
};
