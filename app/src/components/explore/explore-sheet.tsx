import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { FILTER_GROUPS, type Filters } from '@/config/filters';
import { colors, space } from '@/theme';

type ExploreSheetProps = {
  initialFilters: Filters;
  /** Called once the sheet has slid away: the chosen filters, or null after Skip */
  onClose: (applied: Filters | null) => void;
};

// Edits only count when "show plants" is pressed
export function ExploreSheet({ initialFilters, onClose }: ExploreSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const appliedRef = useRef<Filters | null>(null);
  const [draft, setDraft] = useState(initialFilters);

  const selectedCount = Object.values(draft).reduce((total, ids) => total + ids.length, 0);

  const toggle = (groupId: string, optionId: string) => {
    setDraft((current) => {
      const selected = current[groupId] ?? [];
      const next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId];
      return { ...current, [groupId]: next };
    });
  };

  const closeSheet = () => sheetRef.current?.close();

  const apply = () => {
    appliedRef.current = draft;
    closeSheet();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      title="Εξερεύνηση"
      initialSnap="full"
      onClose={() => onClose(appliedRef.current)}
      headerAction={
        <PressableScale accessibilityRole="button" onPress={closeSheet} style={styles.skip}>
          <AppText bold color={colors.accent}>
            Παράλειψη
          </AppText>
        </PressableScale>
      }
      footer={
        <ActionButton edge={false} glow="soft" onPress={apply}>
          <ActionButtonText>{selectedCount > 0 ? `Εμφάνιση φυτών (${selectedCount})` : 'Εμφάνιση φυτών'}</ActionButtonText>
        </ActionButton>
      }>
      <View style={styles.groups}>
        {FILTER_GROUPS.map((group) => (
          <View key={group.id}>
            <AppText bold style={styles.legend}>
              {group.label}
            </AppText>
            <View style={styles.options}>
              {group.options.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={draft[group.id]?.includes(option.id) ?? false}
                  onToggle={() => toggle(group.id, option.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  skip: {
    paddingVertical: space.xs,
  },
  groups: {
    gap: space.lg,
  },
  legend: {
    marginBottom: space.md,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
