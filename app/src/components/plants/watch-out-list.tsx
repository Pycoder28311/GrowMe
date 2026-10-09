import type { Disease } from '@growme/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { TextPanel } from '@/components/ui/text-panel';
import { colors, iconSize, space } from '@/theme';

/**
 * «Τι να προσέχεις» (the plant's diseases and pests): closed by default; open, each item shows its
 * title with a link icon, and a tap opens its text in a panel.
 */
export function WatchOutList({ items }: { items: Disease[] }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState<Disease | null>(null);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(open ? '180deg' : '0deg') }] }));

  return (
    <Animated.View layout={LinearTransition} style={styles.card}>
      {/* No shrink on press: only a light dim */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={({ pressed }) => [styles.head, pressed && styles.pressed]}>
        <AppText bold accessibilityRole="header">
          Τι να προσέχεις ({items.length})
        </AppText>
        <Animated.View style={chevron}>
          <Icon name="chevronDown" size={iconSize.normal} color={colors.primary} bold />
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.items}>
          {items.map((item) => (
            <PressableScale
              key={item.id}
              accessibilityRole="link"
              accessibilityLabel={item.label ? `${item.title}, ${item.label}` : item.title}
              onPress={() => setShown(item)}
              pressedScale={0.98}
              style={styles.item}>
              <View style={styles.itemText}>
                <AppText>{item.title}</AppText>
                {item.label && (
                  <AppText size="small" color={colors.inkMuted}>
                    {item.label}
                  </AppText>
                )}
              </View>
              <Icon name="link" size={iconSize.normal} color={colors.link} bold />
            </PressableScale>
          ))}
        </Animated.View>
      )}

      {shown && <TextPanel title={shown.title} label={shown.label} text={shown.content} onClose={() => setShown(null)} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    paddingHorizontal: space.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  pressed: {
    opacity: 0.7,
  },
  items: {
    paddingBottom: space.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemText: {
    flex: 1,
  },
});
