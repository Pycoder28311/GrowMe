import type { Page, Post, PostCreate, PostReply } from '@growme/shared';
import { request } from './client';

const page = (cursor?: string | null) => (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');

/** Users' questions (the Messages tab): read by everyone, written when signed in */
export const postsApi = {
  /** 20 posts per call, newest first */
  list: (cursor?: string | null) => request<Page<Post>>(`/posts?limit=20${page(cursor)}`),
  get: (id: number) => request<Post>(`/posts/${id}`),
  create: (input: PostCreate) => request<Post>('/posts', { method: 'POST', body: JSON.stringify(input) }),
};

/** Replies to a post, nested like Reddit: parentReplyId null = answers the post itself */
export const postRepliesApi = {
  /** 20 per call, newest first: the post's own replies, or the answers to one reply */
  list: (postId: number, parentReplyId: number | null, cursor?: string | null) =>
    request<Page<PostReply>>(
      `/post-replies?postId=${postId}${parentReplyId ? `&parentReplyId=${parentReplyId}` : ''}&limit=20${page(cursor)}`,
    ),
  create: (postId: number, parentReplyId: number | null, content: string) =>
    request<PostReply>('/post-replies', {
      method: 'POST',
      body: JSON.stringify({ postId, parentReplyId, content }),
    }),
};
