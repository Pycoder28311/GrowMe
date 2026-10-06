import type { LikedType, LikeState, MyLike } from '@growme/shared';
import { request } from './client';

/**
 * Likes and dislikes (signed in). like_count counts likes only; the server keeps it right:
 * set() adds or switches my reaction, undo() removes it (the row is deleted).
 */
export const likesApi = {
  /** My reactions to these items (up to 100 ids); items I didn't react to are left out */
  mine: (type: LikedType, ids: number[]) => request<MyLike[]>(`/likes?type=${type}&ids=${ids.join(',')}`),
  set: (type: LikedType, id: number, isLike: boolean) =>
    request<LikeState>('/likes', { method: 'PUT', body: JSON.stringify({ type, id, isLike }) }),
  undo: (type: LikedType, id: number) => request<LikeState>(`/likes/${type}/${id}`, { method: 'DELETE' }),
};
