import { getEnv } from './env'

// Turns rounded coordinates into an area name («Χαλάνδρι, Αττική») with the Google Geocoding API,
// when GOOGLE_MAPS_API_KEY is set. The key stays on the server: the app never sees it.
// https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding

type Component = { long_name: string; types: string[] }
type GeocodeResponse = { status: string; results?: { address_components: Component[] }[] }

/** The most local name first (town or suburb), then the region it is in */
const AREA_TYPES = ['locality', 'administrative_area_level_3', 'sublocality', 'administrative_area_level_2']
const REGION_TYPES = ['administrative_area_level_1', 'administrative_area_level_2']

/** The area name for coordinates; null without a key, when Google finds nothing or doesn't answer */
export async function areaName(env: CloudflareBindings, lat: number, lng: number): Promise<string | null> {
  const key = getEnv(env).GOOGLE_MAPS_API_KEY
  if (!key) return null
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.search = new URLSearchParams({
    latlng: `${lat},${lng}`,
    language: 'el',
    result_type: AREA_TYPES.join('|'),
    key,
  }).toString()
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = (await res.json()) as GeocodeResponse
    const components = data.status === 'OK' ? (data.results?.[0]?.address_components ?? []) : []
    const pick = (types: string[]) =>
      types.map((t) => components.find((c) => c.types.includes(t))?.long_name).find(Boolean) ?? null
    const area = pick(AREA_TYPES)
    const region = pick(REGION_TYPES)
    if (!area) return region
    return region && region !== area ? `${area}, ${region}` : area
  } catch {
    return null // the user's own name for the area is kept
  }
}
