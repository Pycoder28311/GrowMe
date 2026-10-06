import type { LikedType } from '@growme/shared';
import { useEffect, useRef, useState } from 'react';

import { likesApi } from '@/api/likes';

export type Reaction = 'like' | 'dislike' | null;

const toReaction = (isLike: boolean | null | undefined): Reaction =>
  isLike === true ? 'like' : isLike === false ? 'dislike' : null;

/** like_count counts likes only: the change in count when my reaction goes from → to */
const countChange = (from: Reaction, to: Reaction) => (to === 'like' ? 1 : 0) - (from === 'like' ? 1 : 0);

const CHUNK = 100; // the API answers up to 100 ids per call

/**
 * My like / dislike on a list of items (posts or replies) and their like counts.
 * - Loads my reactions for the items on screen (only ids not asked before).
 * - toggle(): the same reaction again undoes it (the row is deleted); another one sets or switches
 *   it. The count changes at once and the server's answer then wins; on error both roll back.
 */
export function useReactions(type: LikedType, items: { id: number; likeCount: number }[]) {
  const [mine, setMine] = useState<Record<number, Reaction>>({});
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [error, setError] = useState(false);
  const asked = useRef(new Set<number>());
  const pending = useRef(new Set<number>());
  const ids = items.map((item) => item.id).join(',');

  useEffect(() => {
    const fresh = ids
      .split(',')
      .filter(Boolean)
      .map(Number)
      .filter((id) => !asked.current.has(id));
    if (fresh.length === 0) return;
    for (const id of fresh) asked.current.add(id);
    for (let i = 0; i < fresh.length; i += CHUNK) {
      likesApi
        .mine(type, fresh.slice(i, i + CHUNK))
        .then((rows) =>
          setMine((current) => ({ ...current, ...Object.fromEntries(rows.map((r) => [r.id, toReaction(r.isLike)])) })),
        )
        .catch(() => {});
    }
  }, [type, ids]);

  const stateOf = (item: { id: number; likeCount: number }) => ({
    reaction: mine[item.id] ?? null,
    likeCount: counts[item.id] ?? item.likeCount,
  });

  async function toggle(item: { id: number; likeCount: number }, pressed: Exclude<Reaction, null>) {
    if (pending.current.has(item.id)) return; // one change at a time per item
    pending.current.add(item.id);
    const before = stateOf(item);
    const next: Reaction = before.reaction === pressed ? null : pressed;
    setError(false);
    setMine((current) => ({ ...current, [item.id]: next }));
    setCounts((current) => ({ ...current, [item.id]: before.likeCount + countChange(before.reaction, next) }));
    try {
      const result = next === null ? await likesApi.undo(type, item.id) : await likesApi.set(type, item.id, next === 'like');
      setMine((current) => ({ ...current, [item.id]: toReaction(result.isLike) }));
      setCounts((current) => ({ ...current, [item.id]: result.likeCount }));
    } catch {
      setMine((current) => ({ ...current, [item.id]: before.reaction }));
      setCounts((current) => ({ ...current, [item.id]: before.likeCount }));
      setError(true);
    } finally {
      pending.current.delete(item.id);
    }
  }

  return { stateOf, toggle, error };
}
