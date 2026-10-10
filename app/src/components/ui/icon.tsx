import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import semiBold from 'expo-symbols/androidWeights/semiBold';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, iconSize } from '@/theme';

// Icons from the Plant demo (Lucide), as SF Symbols on iOS and Material Symbols on Android and web
const ICONS = {
  home: { ios: 'house', android: 'home', web: 'home' },
  messages: { ios: 'message', android: 'chat_bubble', web: 'chat_bubble' },
  book: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  location: { ios: 'location', android: 'location_on', web: 'location_on' },
  key: { ios: 'key', android: 'key', web: 'key' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  heart: { ios: 'heart', android: 'favorite', web: 'favorite' },
  leaf: { ios: 'leaf', android: 'eco', web: 'eco' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' },
  privacy: { ios: 'hand.raised', android: 'shield', web: 'shield' },
  cookie: { ios: 'hand.raised', android: 'cookie', web: 'cookie' },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  like: { ios: 'hand.thumbsup', android: 'thumb_up', web: 'thumb_up' },
  dislike: { ios: 'hand.thumbsdown', android: 'thumb_down', web: 'thumb_down' },
  send: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  photo: { ios: 'photo', android: 'image', web: 'image' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  link: { ios: 'link', android: 'link', web: 'link' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  // A plant's facts and characteristics (plant page)
  sun: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  gauge: { ios: 'gauge.with.dots.needle.50percent', android: 'speed', web: 'speed' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  hourglass: { ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty' },
  food: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  aroma: { ios: 'leaf.circle', android: 'spa', web: 'spa' },
  climbing: { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' },
  ornamental: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  succulent: { ios: 'drop', android: 'water_drop', web: 'water_drop' },
  tree: { ios: 'tree', android: 'park', web: 'park' },
  fence: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  sea: { ios: 'water.waves', android: 'waves', web: 'waves' },
  frost: { ios: 'snowflake', android: 'ac_unit', web: 'ac_unit' },
  wind: { ios: 'wind', android: 'air', web: 'air' },
  flower: { ios: 'camera.macro', android: 'local_florist', web: 'local_florist' },
  ruler: { ios: 'ruler', android: 'straighten', web: 'straighten' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Thicker strokes, for small icons next to bold text */
  bold?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = iconSize.big, color = colors.ink, bold, style }: IconProps) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      weight={bold ? { ios: 'semibold', android: semiBold } : undefined}
      style={style}
    />
  );
}
