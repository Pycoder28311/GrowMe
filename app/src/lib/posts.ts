import { useCallback } from 'react';

import { postRepliesApi, postsApi } from '@/api/posts';
import { useApiItem, usePagedList } from '@/lib/use-api';

/** The community's posts, newest first, a page at a time */
export function usePosts() {
  const { items, ...rest } = usePagedList(postsApi.list);
  return { posts: items, ...rest };
}

/** One post */
export function usePost(id: number) {
  const { item, ...rest } = useApiItem(postsApi.get, id);
  return { post: item, ...rest };
}

/** One level of a post's replies: the post's own (parentReplyId null) or the answers to one reply */
export function useReplies(postId: number, parentReplyId: number | null) {
  const fetchPage = useCallback(
    (cursor: string | null) => postRepliesApi.list(postId, parentReplyId, cursor),
    [postId, parentReplyId],
  );
  const { items, ...rest } = usePagedList(fetchPage);
  return { replies: items, ...rest };
}

const MAX_TITLE = 120;

/**
 * A post title made from the question: its first sentence (up to . ; ? ! or a new line), at most
 * 120 characters, cut at a word with «…» when longer. `;` is the Greek question mark.
 */
export function firstSentence(text: string) {
  const flat = text.trim();
  const end = flat.search(/[.;\u037e?!\n]/);
  const sentence = (end === -1 ? flat : flat.slice(0, end + (flat[end] === '\n' ? 0 : 1))).trim();
  if (sentence.length <= MAX_TITLE) return sentence;
  const cut = sentence.slice(0, MAX_TITLE - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > MAX_TITLE / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
