import type { LocationSet, Page, Post, UserLocation } from '@growme/shared';
import { request } from './client';

/** The signed-in user's own data (the profile page). Name and password go through authClient. */
export const meApi = {
  /** My area, or null when I haven't set one */
  location: () => request<UserLocation | null>('/me/location'),
  /** Saves my area (coordinates rounded to about 1 km); the server may name it with Google */
  setLocation: (input: LocationSet) => request<UserLocation>('/me/location', { method: 'PUT', body: JSON.stringify(input) }),
  removeLocation: () => request<void>('/me/location', { method: 'DELETE' }),
  /** Posts I liked, 20 per call, the newest like first */
  likedPosts: (cursor?: string | null) =>
    request<Page<Post>>(`/me/liked-posts?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
};
