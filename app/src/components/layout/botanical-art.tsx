import { Image } from 'expo-image';
import type { ImageSource } from 'expo-image';

import type { ArtName } from '@/theme';

// The painted clusters at the edges of the mockup's article page, redrawn in full as pixels (transparent around them,
// nothing cut off by the image's edges) in the mockup's flat watercolour look; `size` is the width they are drawn at.

type Art = { source: ImageSource; width: number; height: number };

const ARTS: Record<ArtName, Art> = {
  // Right edge, under the photo: two blossoms on one stem, olive leaves, over a peach wash
  blossomRight: { source: require('@/assets/images/art/blossom-right.png'), width: 200, height: 520 },
  // Left edge, mid page: a tan bulb with khaki leaves
  bulbLeft: { source: require('@/assets/images/art/bulb-left.png'), width: 110, height: 300 },
  // Right edge, lower: two blossoms over a wash
  blossomBottom: { source: require('@/assets/images/art/blossom-bottom.png'), width: 210, height: 170 },
  // Left edge over the photo: two coral petals and a khaki leaf
  petalsLeft: { source: require('@/assets/images/art/petals-left.png'), width: 170, height: 370 },
};

/** A cluster's height as a share of its width, so a box can be sized from one number */
export const artAspect = (name: ArtName) => ARTS[name].height / ARTS[name].width;

export function BotanicalArt({ name, size }: { name: ArtName; size: number }) {
  return <Image source={ARTS[name].source} contentFit="fill" accessible={false} style={{ width: size, height: size * artAspect(name) }} />;
}
