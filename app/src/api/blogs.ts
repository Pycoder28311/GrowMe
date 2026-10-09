import type { Blog, BlogComment, BlogKind, Page } from '@growme/shared';
import { request } from './client';

/** Encyclopedia articles written in the admin dashboard (public: no sign-in needed) */
export const blogsApi = {
  /**
   * 20 articles per call, newest first; pass the previous page's nextCursor to get the next 20.
   * `kind`: only that kind (the Encyclopedia's tabs)
   */
  list: (cursor?: string | null, kind?: BlogKind) =>
    request<Page<Blog>>(
      `/blogs?limit=20${kind ? `&kind=${kind}` : ''}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),
  get: (id: number) => request<Blog>(`/blogs/${id}`),
};

/** Readers' comments on an article, nested like Reddit: parentCommentId null = a top-level comment */
export const blogCommentsApi = {
  /** 20 per call, newest first: the article's own comments, or the answers to one comment */
  list: (blogId: number, parentCommentId: number | null, cursor?: string | null) =>
    request<Page<BlogComment>>(
      `/blog-comments?blogId=${blogId}${parentCommentId ? `&parentCommentId=${parentCommentId}` : ''}&limit=20${
        cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
      }`,
    ),
  create: (blogId: number, parentCommentId: number | null, content: string) =>
    request<BlogComment>('/blog-comments', {
      method: 'POST',
      body: JSON.stringify({ blogId, parentCommentId, content }),
    }),
};
