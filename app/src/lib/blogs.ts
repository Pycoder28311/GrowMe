import { readingMinutes, type Blog } from '@growme/shared';

import { blogsApi } from '@/api/blogs';
import { useApiItem, usePagedList } from '@/lib/use-api';

/** The Encyclopedia's articles from the API, newest first, a page at a time */
export function useBlogs() {
  const { items, ...rest } = usePagedList(blogsApi.list);
  return { blogs: items, ...rest };
}

/** One article */
export function useBlog(id: number) {
  const { item, ...rest } = useApiItem(blogsApi.get, id);
  return { blog: item, ...rest };
}

/** Reading time in minutes (same as the dashboard's badge) */
export const readMinutes = (blog: Pick<Blog, 'content'>) => readingMinutes(blog.content);

/** "12 Μαΐου 2026" */
export const publishedDate = (blog: Pick<Blog, 'createdAt'>) =>
  new Date(blog.createdAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
