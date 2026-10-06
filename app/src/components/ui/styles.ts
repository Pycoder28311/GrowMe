import type { ViewStyle } from 'react-native';

import { alpha, colors, outline, radius, shadow, size } from '@/theme';

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

// White card that reads over photos and washes: plant cards, settings, plant details
export const card: ViewStyle = {
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: outline,
  backgroundColor: alpha(colors.surface, 0.95),
  boxShadow: shadow.card,
};
