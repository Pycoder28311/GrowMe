import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SunRangeFilter } from '@/components/results/sun-range';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Section } from '@/components/ui/section';
import { QUICK_FILTERS, type Range, type Selection } from '@/config/section-filters';
import { setRange, toggleOption } from '@/lib/plant-filter-match';
import { colors, space } from '@/theme';

type ExploreSheetProps = {
  initialSelection: Selection;
  /** Called once the sheet has slid away: the chosen filters, or null after «Παράλειψη» */
  onClose: (applied: Selection | null) => void;
};

/**
 * The home screen's quick plant filters (the `quick` filters of config/section-filters.ts), drawn by kind like
 * the results page's sheets. Edits only count when «Εμφάνιση φυτών» is pressed.
 */
export function ExploreSheet({ initialSelection, onClose }: ExploreSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const appliedRef = useRef<Selection | null>(null);
  const [draft, setDraft] = useState(initialSelection);

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
          <ActionButtonText>Εμφάνιση φυτών</ActionButtonText>
        </ActionButton>
      }>
      <View style={styles.groups}>
        {QUICK_FILTERS.map((filter) => (
          <Section key={filter.key} title={filter.kind === 'range' ? (filter.group ?? filter.label) : filter.label}>
            {filter.kind === 'range' ? (
              <SunRangeFilter
                title={filter.label}
                min={filter.min}
                max={filter.max}
                ticks={filter.ticks}
                value={(draft[filter.key] as Range | undefined) ?? [filter.min, filter.max]}
                onChange={(range) => setDraft(setRange(draft, filter, range))}
              />
            ) : (
              <View style={styles.options}>
                {filter.options.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    selected={((draft[filter.key] ?? []) as readonly string[]).includes(option.id)}
                    onToggle={() => setDraft(toggleOption(draft, filter, option.id))}
                  />
                ))}
              </View>
            )}
          </Section>
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
