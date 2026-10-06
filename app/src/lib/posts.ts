import type { PostReply } from '@growme/shared';
import { useMemo } from 'react';

import { postRepliesApi, postsApi } from '@/api/posts';
import type { ThreadSource } from '@/components/discussion/reply-thread';
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

/** A post's reply tree, for <ReplyLevel> */
export function usePostThread(postId: number): ThreadSource<PostReply> {
  return useMemo(
    () => ({
      likedType: 'post_reply',
      list: (parentId, cursor) => postRepliesApi.list(postId, parentId, cursor),
      create: (parentId, content) => postRepliesApi.create(postId, parentId, content),
      words: {
        loadError: 'Δεν ήταν δυνατή η φόρτωση των απαντήσεων.',
        sendError: 'Η απάντηση δεν στάλθηκε. Δοκίμασε ξανά.',
        more: 'Περισσότερες απαντήσεις',
      },
    }),
    [postId],
  );
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
