import type { Blog, Page } from '@growme/shared';
import { request } from './client';

/** Encyclopedia articles written in the admin dashboard (public: no sign-in needed) */
export const blogsApi = {
  /** 20 articles per call, newest first; pass the previous page's nextCursor to get the next 20 */
  list: (cursor?: string | null) =>
    request<Page<Blog>>(`/blogs?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
  get: (id: number) => request<Blog>(`/blogs/${id}`),
};
