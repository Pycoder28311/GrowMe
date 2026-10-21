import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { tabDef } from '@/config/plant-page';
import { botanical, radius, space } from '@/theme';

import type { StageGroup } from './stage-groups';

/**
 * The life cycle's tab buttons («Από σπόρο» | «Μεταφύτευση» | «Περιποίηση»), one per group the plant has:
 * the tab picked is filled with its colour (cream words), the others show their group's soft tint.
 */
export function TabButtons({ groups, lit, onPick }: { groups: readonly StageGroup[]; lit: number; onPick: (index: number) => void }) {
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {groups.map((group, index) => {
        const { label, color, tone } = tabDef(group.tab);
        const on = index === lit;
        return (
          <Pressable
            key={group.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
            onPress={() => onPick(index)}
            style={({ pressed }) => [
              styles.button,
              on ? { backgroundColor: color, borderColor: color } : { backgroundColor: tone.background },
              pressed && styles.pressed,
            ]}>
            <AppText bold={on} color={on ? botanical.cream : botanical.ink}>
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
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: botanical.line,
  },
  pressed: {
    opacity: 0.8,
  },
});
