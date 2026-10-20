import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SunRangeFilter } from '@/components/results/sun-range';
import { ActionButton } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Section } from '@/components/ui/section';
import {
  chipFiltersFor,
  NO_FILTERS,
  toggleOption,
  type SectionFilters,
  type SectionId,
} from '@/config/section-filters';
import { colors, space } from '@/theme';

const TITLES: Record<SectionId, string> = {
  indoor: 'Φίλτρα · Εσωτερικός χώρος',
  outdoor: 'Φίλτρα · Εξωτερικός χώρος',
};

type SectionFilterSheetProps = {
  section: SectionId;
  /** What is chosen now (the sheet starts from it) */
  filters: SectionFilters;
  /** The choices, when «Υποβολή» is pressed (closing the sheet another way drops them) */
  onSubmit: (filters: SectionFilters) => void;
  onClose: () => void;
};

/**
 * One section's filters, sliding up from below: the two sunlight bars, then the chip filters that section has
 * (the outdoor section also has the usage and the sowing season). A draft until «Υποβολή»; «Καθαρισμός» clears it.
 */
export function SectionFilterSheet({ section, filters, onSubmit, onClose }: SectionFilterSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [draft, setDraft] = useState<SectionFilters>(filters);
  const applied = useRef(false);

  const submit = () => {
    applied.current = true;
    sheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      title={TITLES[section]}
      initialSnap="full"
      onClose={() => {
        if (applied.current) onSubmit(draft);
        onClose();
      }}
      headerAction={
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Καθαρισμός όλων των φίλτρων"
          onPress={() => setDraft(NO_FILTERS)}
          style={styles.clear}>
          <AppText bold color={colors.accent}>
            Καθαρισμός
          </AppText>
        </PressableScale>
      }
      footer={
        <ActionButton size="md" color="green" edge={false} glow="soft" onPress={submit}>
          <AppText bold color={colors.surface}>
            Υποβολή
          </AppText>
        </ActionButton>
      }>
      <View style={styles.sections}>
        <Section title="Φως (από τις 6 το πρωί έως τις 9 το βράδυ)">
          <View style={styles.sun}>
            <SunRangeFilter title="Έντονο φως" value={draft.sunIntense} onChange={(sunIntense) => setDraft({ ...draft, sunIntense })} />
            <SunRangeFilter title="Μη έντονο φως" value={draft.sunWeak} onChange={(sunWeak) => setDraft({ ...draft, sunWeak })} />
          </View>
        </Section>

        {chipFiltersFor(section).map((filter) => (
          <Section key={filter.key} title={filter.label}>
            <View style={styles.options}>
              {filter.options.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={draft[filter.key].includes(option.id)}
                  onToggle={() => setDraft(toggleOption(draft, filter, option.id))}
                />
              ))}
            </View>
          </Section>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: space.lg,
  },
  sun: {
    gap: space.lg,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  clear: {
    paddingVertical: space.xs,
  },
});
