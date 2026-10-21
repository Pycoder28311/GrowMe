import type { SearchIndex } from '@growme/shared';

import { toSearchPlant } from './plant-shape';
import { request } from './client';

type RawIndex = Omit<SearchIndex, 'plants'> & { plants: Record<string, unknown>[] };

/** Every plant and blog the search can find (public; the server caches it for 5 minutes) */
export const searchApi = {
  index: (): Promise<SearchIndex> =>
    request<RawIndex>('/search-index').then((index) => ({ ...index, plants: index.plants.map(toSearchPlant) })),
};
