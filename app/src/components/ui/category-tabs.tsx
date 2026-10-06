import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, outline, radius, shadow, space } from '@/theme';

type CategoryTabsProps = {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
};

/** Single-choice quick filters shown as equal pills in one row (e.g. Όλα · Κηπευτικά · Με άνθη) */
export function CategoryTabs({ tabs, activeId, onChange }: CategoryTabsProps) {
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
});
