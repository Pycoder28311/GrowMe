import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { LIFECYCLE_TAB_DEFS } from '@/config/plant-page';
import { colors, radius, shadow, space } from '@/theme';

import type { StageGroup } from './stage-groups';

/**
 * The life cycle's tab buttons («Από σπόρο» | «Μεταφύτευση» | «Περιποίηση»), one per group the plant has:
 * the tab picked is lit (its colour on the outline and the words), the others are plain white.
 */
export function TabButtons({ groups, lit, onPick }: { groups: readonly StageGroup[]; lit: number; onPick: (index: number) => void }) {
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {groups.map((group, index) => {
        const { label, color } = LIFECYCLE_TAB_DEFS.find((def) => def.tab === group.tab)!;
        const on = index === lit;
        return (
          <Pressable
            key={group.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
            onPress={() => onPick(index)}
            style={({ pressed }) => [styles.button, on && { borderColor: color }, pressed && styles.pressed]}>
            <AppText bold={on} color={on ? color : colors.inkMuted}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  pressed: {
    opacity: 0.8,
  },
});
