import { createContext, use, useState, type ReactNode } from 'react';

import { EXAMPLE_POSTS, type CommunityPost, type Reply } from '@/config/community-posts';
import { authClient } from '@/lib/auth-client';

type Community = {
  posts: CommunityPost[];
  /** Adds a post at the top; returns its id */
  addPost: (text: string) => string;
  /** Answers the post itself (parentId null) or one of its replies */
  addReply: (postId: string, parentId: string | null, text: string) => void;
};

const CommunityContext = createContext<Community | null>(null);

// Adds `reply` under the reply with id `parentId`, at any depth
const insertReply = (replies: Reply[], parentId: string, reply: Reply): Reply[] =>
  replies.map((r) =>
    r.id === parentId ? { ...r, replies: [...r.replies, reply] } : { ...r, replies: insertReply(r.replies, parentId, reply) },
  );

/**
 * The community posts, shared by the list and the post pages. Kept in memory for now (example
 * posts plus what the user writes); later they come from the API.
 */
export function CommunityProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const [posts, setPosts] = useState<CommunityPost[]>(EXAMPLE_POSTS);
  const author = session?.user.name || 'Εσύ';

  const newItem = (text: string): Reply => ({
    id: `new-${Date.now()}`,
    author,
    date: 'Μόλις τώρα',
    text,
    likeCount: 0,
    replies: [],
  });

  const addPost = (text: string) => {
    const post = { ...newItem(text), createdAt: Date.now() };
    setPosts((current) => [post, ...current]);
    return post.id;
  };

  const addReply = (postId: string, parentId: string | null, text: string) => {
    const reply = newItem(text);
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        return parentId === null
          ? { ...post, replies: [...post.replies, reply] }
          : { ...post, replies: insertReply(post.replies, parentId, reply) };
      }),
    );
  };

  return <CommunityContext value={{ posts, addPost, addReply }}>{children}</CommunityContext>;
}

export function useCommunity() {
  const value = use(CommunityContext);
  if (!value) throw new Error('useCommunity must be used inside CommunityProvider');
  return value;
}
