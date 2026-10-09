import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, outline, quietGray, radius, shadow, space } from '@/theme';

type CategoryTabsProps = {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
  /**
   * `equal` (default): equal pills in one row. `scroll`: light-gray pills sized to their words in a
   * row that scrolls sideways, its scrollbar hidden (e.g. the Encyclopedia's kinds)
   */
  variant?: 'equal' | 'scroll';
};

/** Single-choice quick filters shown as equal pills in one row (e.g. Όλα · Κηπευτικά · Με άνθη) */
export function CategoryTabs({ tabs, activeId, onChange, variant = 'equal' }: CategoryTabsProps) {
  if (variant === 'scroll') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hiddenBar} contentContainerStyle={styles.row}>
        {tabs.map(({ id, label }) => {
          const isActive = id === activeId;
          return (
            <PressableScale
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(id)}
              pressedScale={0.96}
              style={[styles.light, isActive && styles.lightActive]}>
              <AppText bold={isActive} color={isActive ? colors.ink : colors.inkMuted}>
                {label}
              </AppText>
            </PressableScale>
          );
        })}
      </ScrollView>
    );
  }
  return (
    <View style={styles.row}>
      {tabs.map(({ id, label }) => {
        const isActive = id === activeId;
        return (
          <PressableScale
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(id)}
            style={[styles.tab, isActive ? styles.active : styles.inactive]}>
            <AppText bold color={isActive ? colors.surface : colors.ink}>
              {label}
            </AppText>
          </PressableScale>
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
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    boxShadow: shadow.small,
  },
  active: {
    backgroundColor: colors.primary,
  },
  inactive: {
    backgroundColor: alpha(colors.surface, 0.9),
    borderWidth: 1,
    borderColor: outline,
  },
  // The scroll variant: no scrollbar on web either
  hiddenBar: Platform.OS === 'web' ? ({ scrollbarWidth: 'none' } as object) : {},
  light: {
    alignItems: 'center',
    borderRadius: radius.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: quietGray,
  },
  lightActive: {
    backgroundColor: '#d9dde2',
  },
});
