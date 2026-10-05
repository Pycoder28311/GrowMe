import type { ViewStyle } from 'react-native';

import { outline, radius, shadow, size } from '@/theme';

// Shared look for the selected bottom tab and the corner buttons: a raised tile.
// The background is set separately so each can choose how see-through it is.
export const raisedTile: ViewStyle = {
  width: size.touch,
  height: size.touch,
  borderRadius: radius.sm,
  borderWidth: 1,
  borderColor: outline,
  boxShadow: shadow.raised,
};

// Icon on a raised tile: multiplied with what is behind it so it reads as a darker shade of it
export const tileIcon: ViewStyle = { mixBlendMode: 'multiply' };
