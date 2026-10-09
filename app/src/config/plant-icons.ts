import type { PlantFlag, PlantKind } from '@growme/shared';

import type { IconName } from '@/components/ui/icon';

// The plant page's icons: one per characteristic (a dashboard checkbox), plus wind, kind and size and
// the facts, each with the faded colour of the circle behind it. The icon itself is light gray.

export type PlantIcon = { icon: IconName; tint: string };

export const FLAG_ICONS: Record<PlantFlag, PlantIcon> = {
  food: { icon: 'food', tint: '#fde8d4' },
  aromatic: { icon: 'aroma', tint: '#e3f1e6' },
  climbing: { icon: 'climbing', tint: '#e6eefb' },
  ornamental: { icon: 'ornamental', tint: '#f8e4f0' },
  succulent: { icon: 'succulent', tint: '#dff2f1' },
  smallTree: { icon: 'tree', tint: '#e8f0dc' },
  privacy: { icon: 'fence', tint: '#ece8f8' },
  nearSea: { icon: 'sea', tint: '#ddeefa' },
  frostHardy: { icon: 'frost', tint: '#e4f2fb' },
};

export const KIND_ICONS: Record<PlantKind, PlantIcon> = {
  flowers: { icon: 'flower', tint: '#fbe3e8' },
  leaves: { icon: 'leaf', tint: '#e3f1e6' },
  bush: { icon: 'tree', tint: '#e8f0dc' },
};

export const WIND_ICON: PlantIcon = { icon: 'wind', tint: '#e8eef5' };
export const SIZE_ICON: PlantIcon = { icon: 'ruler', tint: '#f5efdc' };

/** The facts card's rows and the origin */
export const FACT_ICONS = {
  sun: { icon: 'sun', tint: '#fff0cc' },
  difficulty: { icon: 'gauge', tint: '#e6eefb' },
  season: { icon: 'calendar', tint: '#fbe3e8' },
  lifespan: { icon: 'hourglass', tint: '#efe9f8' },
  origin: { icon: 'location', tint: '#e3f1e6' },
} as const satisfies Record<string, PlantIcon>;

/** The icons' own colour (light gray, so the tinted circle carries the colour) */
export const ICON_GRAY = '#9ca3af';
