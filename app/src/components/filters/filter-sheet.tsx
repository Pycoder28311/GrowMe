import type { SearchPlant } from '@growme/shared';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FilterSection } from '@/components/filters/filter-section';
import { FiltersButton } from '@/components/filters/filters-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { PillButton } from '@/components/ui/pill-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Section } from '@/components/ui/section';
import { FULL_FILTERS, PRESETS, type Filters } from '@/config/plant-filters';
import { useExploreFilters } from '@/lib/explore-filters';
import { priceCounts } from '@/lib/plant-filter-match';
import { colors, space } from '@/theme';

/** Where the Filters button sits on screen (from measureInWindow) */
export type ButtonFrame = { x: number; y: number; width: number; height: number };

type FilterSheetProps = {
  /** The Filters button's frame: the Submit button is drawn exactly there, so it looks like the same button */
  buttonFrame: ButtonFrame;
  /** Every plant (the search index), for the price chart */
  plants: readonly SearchPlant[];
  onClose: () => void;
};

/**
 * The results page's filters, sliding up from below: every filter except the kind (the page's tabs).
 * Choices are a draft until Submit; closing the sheet another way drops them. «Καθαρισμός» clears all.
 */
export function FilterSheet({ buttonFrame, plants, onClose }: FilterSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const screenHeight = useWindowDimensions().height;
  const { filters, setFilters } = useExploreFilters();
  const [draft, setDraft] = useState<Filters>(filters);
  const applied = useRef(false);
  const prices = useMemo(() => priceCounts(plants), [plants]);

  const submit = () => {
    applied.current = true;
    sheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      title="Φίλτρα"
      initialSnap="full"
      onClose={() => {
        if (applied.current) setFilters(draft);
        onClose();
      }}
      headerAction={
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Καθαρισμός όλων των φίλτρων"
          onPress={() => setDraft({})}
          style={styles.clear}>
          <AppText bold color={colors.accent}>
            Καθαρισμός
          </AppText>
        </PressableScale>
      }
      // Lets the last section scroll above the Submit button
      contentBottomInset={screenHeight - buttonFrame.y}
      floating={
        <FiltersButton
          submit
          onPress={submit}
          style={[styles.submit, { left: buttonFrame.x, top: buttonFrame.y, width: buttonFrame.width }]}
        />
      }>
      <View style={styles.sections}>
        {FULL_FILTERS.map((id) => (
          <FilterSection key={id} id={id} filters={draft} onChange={setDraft} prices={prices} />
        ))}
        <Section title="Δημοφιλείς αναζητήσεις">
          <View style={styles.presets}>
            {PRESETS.map((preset) => (
              <PillButton key={preset.id} label={preset.label} onPress={() => setDraft(preset.filters)} />
            ))}
          </View>
        </Section>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: space.lg,
  },
  presets: {
    gap: space.sm,
  },
  clear: {
    paddingVertical: space.xs,
  },
  submit: {
    position: 'absolute',
  },
});
