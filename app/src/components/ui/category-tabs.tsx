import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, outline, radius, shadow, space } from '@/theme';

type CategoryTabsProps = {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
  /**
   * `equal` (default): equal pills in one row. `scroll`: white buttons (a border on the chosen and the pressed one) sized to
   * their words in a row that scrolls sideways, its scrollbar hidden (the plants' and Encyclopedia's
   * kinds), spread across the width when they fit (never closer than a small gap); the chosen one has a black border
   */
  variant?: 'equal' | 'scroll';
};

/** Single-choice quick filters shown as equal pills in one row (e.g. Όλα · Κηπευτικά · Με άνθη) */
export function CategoryTabs({ tabs, activeId, onChange, variant = 'equal' }: CategoryTabsProps) {
  const [pressedId, setPressedId] = useState<string | null>(null);
  if (variant === 'scroll') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hiddenBar} contentContainerStyle={styles.spread}>
        {tabs.map(({ id, label }) => {
          const isActive = id === activeId;
          return (
            <PressableScale
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(id)}
              onPressIn={() => setPressedId(id)}
              onPressOut={() => setPressedId(null)}
              pressedScale={0.96}
              style={[styles.light, isActive && styles.lightActive, pressedId === id && styles.lightPressed]}>
              <AppText bold={isActive} color={colors.ink}>
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
  // The scroll variant: spread across the width when they fit; when they don't, the minimum gap and a sideways scroll
  spread: {
    minWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
    // Room below, so the tabs' shadow isn't cut by the scroll view
    paddingBottom: space.sm,
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
  // The same border width in both states, so choosing one never moves the others
  light: {
    alignItems: 'center',
    borderRadius: radius.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  // The chosen one and the one being pressed show a border
  lightActive: {
    borderColor: '#000000',
  },
  lightPressed: {
    borderColor: '#000000',
  },
});
