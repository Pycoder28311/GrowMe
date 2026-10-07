import { z } from 'zod'

/* ─────────────── The user's area (profile): approximate, for plant advice by climate ─────────────── */

/** Coordinates keep 2 decimals (about 1 km): enough for the climate, never the exact address */
export const roundCoordinate = (value: number) => Math.round(value * 100) / 100

/**
 * PUT /api/me/location: the device's position, already rounded by the app (the server rounds again).
 * `area` is the name the phone found, used when the server has no Google key to look it up itself.
 */
export const locationSet = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  area: z.string().trim().min(1).max(100).nullable().default(null),
})

export type LocationSet = z.infer<typeof locationSet>

export type UserLocation = {
  /** e.g. «Χαλάνδρι, Αττική»; null when no name was found */
  area: string | null
  lat: number
  lng: number
  updatedAt: string
}
