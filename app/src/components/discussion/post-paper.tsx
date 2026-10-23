import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PaperGrain } from '@/components/ui/flower-shapes';
import { POSTS_COLORS, radius, space, tileGrain, tileShadowStyle } from '@/theme';

/**
 * The posts' card: warm paper with the plant page tiles' grain, rounded, with their soft shadow and the page's side
 * margin. The posts list and the replies under a post are all made of it. `style` places it (e.g. the gap below).
 */
export const PostPaper = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  // The shadow sits on an outer view: the paper clips its grain, which would cut a shadow
  <View style={[styles.card, style]}>
    <View style={styles.paper}>
      <PaperGrain opacity={tileGrain} />
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: POSTS_COLORS.post,
    ...tileShadowStyle,
  },
  paper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
