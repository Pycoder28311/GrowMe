import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, space } from '@/theme';

import type { StageGroup } from './stage-groups';

const BUTTONS: { group: StageGroup; label: string; color: string }[] = [
  { group: 'seed', label: 'Από σπόρο', color: colors.seed },
  { group: 'plant', label: 'Μεταμφύτευση', color: colors.primary },
];

/**
 * The life cycle's two big buttons, «Από σπόρο» | «Μεταμφύτευση»: the group whose stages take more
 * of the screen is lit (its own colour), the other one is gray
 */
export function GroupButtons({ lit, onPick }: { lit: StageGroup; onPick: (group: StageGroup) => void }) {
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {BUTTONS.map(({ group, label, color }) => {
        const on = group === lit;
        return (
          <Pressable
            key={group}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
            onPress={() => onPick(group)}
            style={({ pressed }) => [styles.button, { backgroundColor: on ? color : GRAY }, pressed && styles.pressed]}>
            <AppText bold={on} color={on ? colors.surface : colors.ink}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const GRAY = '#dcdce0';

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
  },
  pressed: {
    opacity: 0.8,
  },
});
