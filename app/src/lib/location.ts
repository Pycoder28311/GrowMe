import { roundCoordinate, type LocationSet } from '@growme/shared';
import * as Location from 'expo-location';

// The user's area for the profile: the phone's approximate position, rounded to about 1 km before it
// leaves the phone, and a name for it. The server names it with Google (GOOGLE_MAPS_API_KEY) when it
// can; otherwise the phone's own name is kept (none on the web). Plant advice by climate reads it later.

export type LocationError = 'denied' | 'unavailable';

/** «Χαλάνδρι, Αττική» from the phone's reverse lookup; null when it has none (e.g. on the web) */
async function phoneAreaName(latitude: number, longitude: number) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return null;
    const area = place.city ?? place.district ?? place.subregion;
    const region = place.region;
    const name = area && region && region !== area ? `${area}, ${region}` : (area ?? region);
    return name ? name.slice(0, 100) : null;
  } catch {
    return null;
  }
}

/** Asks for permission, reads an approximate position and rounds it; throws a LocationError */
export async function approximateLocation(): Promise<LocationSet> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('denied' satisfies LocationError);
  let position: Location.LocationObject;
  try {
    position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
  } catch {
    throw new Error('unavailable' satisfies LocationError);
  }
  const lat = roundCoordinate(position.coords.latitude);
  const lng = roundCoordinate(position.coords.longitude);
  return { lat, lng, area: await phoneAreaName(lat, lng) };
}

/** «38.03° Β, 23.80° Α»: shown when the area has no name */
export const coordinatesLabel = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'Β' : 'Ν'}, ${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'Α' : 'Δ'}`;
