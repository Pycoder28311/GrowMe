import { readingMinutes, type Blog, type BlogComment } from '@growme/shared';
import { useMemo } from 'react';

import { blogCommentsApi, blogsApi } from '@/api/blogs';
import type { ThreadSource } from '@/components/discussion/reply-thread';
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

/** An article's comment tree, for <ReplyLevel> */
export function useCommentThread(blogId: number): ThreadSource<BlogComment> {
  return useMemo(
    () => ({
      likedType: 'blog_comment',
      list: (parentId, cursor) => blogCommentsApi.list(blogId, parentId, cursor),
      create: (parentId, content) => blogCommentsApi.create(blogId, parentId, content),
      words: {
        loadError: 'Δεν ήταν δυνατή η φόρτωση των σχολίων.',
        sendError: 'Το σχόλιο δεν στάλθηκε. Δοκίμασε ξανά.',
        more: 'Περισσότερα σχόλια',
      },
    }),
    [blogId],
  );
}

/** Reading time in minutes (same as the dashboard's badge) */
export const readMinutes = (blog: Pick<Blog, 'content'>) => readingMinutes(blog.content);

/** "12 Μαΐου 2026" */
export const publishedDate = (blog: Pick<Blog, 'createdAt'>) =>
  new Date(blog.createdAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
