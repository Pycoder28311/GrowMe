import type { BlogKind } from './blogs'
import type { PlantFlag } from './plant-fields'
import type { PlantSummary } from './plants'

/* ─────────────── The app's search (top-right): everything it can find, loaded once ─────────────── */

/** What the app's plant filters read (plan 09): one list, so the index and the filters agree */
export type PlantFilterFields = Pick<
  PlantSummary,
  'priceMin' | 'priceMax' | 'sunStart' | 'sunEnd' | 'monthRanges' | 'wind' | 'kind' | 'size' | 'difficulty' | PlantFlag
>

export type SearchPlant = PlantFilterFields & { id: number; name: string; scientificName: string; image: string | null }
export type SearchBlog = { id: number; name: string; kind: BlogKind; image: string | null }

/** GET /api/search-index: every plant (with its filter fields) and blog with its first cover; the app
 * filters it as you type, and filters the plants by their fields */
export type SearchIndex = { plants: SearchPlant[]; blogs: SearchBlog[] }
