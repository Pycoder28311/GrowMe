import { Easing, Keyframe } from 'react-native-reanimated';

import { space } from '@/theme';

/**
 * Entering animation: rises a little and springs up to full size (380ms).
 * A new Keyframe per use, because delay() changes the instance it is called on.
 */
export const popIn = (delayMs = 0) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateY: space.sm }, { scale: 0.7 }] },
    100: {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    },
  })
    .duration(380)
    .delay(delayMs);
