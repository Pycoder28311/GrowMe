import type { ImageSource } from 'expo-image';

import { MOCK_PHOTOS } from '@/config/mock-plants';

/**
 * A photo's url as an image source: a web address, or «mock:<key>» for a mock plant's bundled photo. A bundled
 * image is a number on the phone but `{ uri, width, height }` or a plain path on the web, so all three pass.
 */
export function photoSource(url: string): ImageSource | number {
  if (url.startsWith('mock:')) {
    const bundled: unknown = MOCK_PHOTOS[url.slice(5)];
    if (typeof bundled === 'number') return bundled;
    if (typeof bundled === 'string') return { uri: bundled };
    if (bundled && typeof bundled === 'object' && 'uri' in bundled) return bundled as ImageSource;
  }
  return { uri: url };
}
