import type { SearchIndex } from '@growme/shared';
import { request } from './client';

/** Every plant and blog the search can find (public; the server caches it for 5 minutes) */
export const searchApi = {
  index: () => request<SearchIndex>('/search-index'),
};
