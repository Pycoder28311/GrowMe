import type { BlogKind } from './blogs'

/* ─────────────── The app's search (top-right): everything it can find, loaded once ─────────────── */

export type SearchPlant = { id: number; name: string; scientificName: string; image: string | null }
export type SearchBlog = { id: number; name: string; kind: BlogKind; image: string | null }

/** GET /api/search-index: every plant and blog with its first cover; the app filters it as you type */
export type SearchIndex = { plants: SearchPlant[]; blogs: SearchBlog[] }
