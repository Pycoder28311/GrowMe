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
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' },
  notes: { ios: 'note.text', android: 'sticky_note_2', web: 'sticky_note_2' },
  privacy: { ios: 'hand.raised', android: 'shield', web: 'shield' },
  cookie: { ios: 'hand.raised', android: 'cookie', web: 'cookie' },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  like: { ios: 'hand.thumbsup', android: 'thumb_up', web: 'thumb_up' },
  dislike: { ios: 'hand.thumbsdown', android: 'thumb_down', web: 'thumb_down' },
  send: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
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
