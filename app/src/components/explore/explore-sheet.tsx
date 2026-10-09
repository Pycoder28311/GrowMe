import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FilterSection } from '@/components/filters/filter-section';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SHORT_FILTERS, type Filters } from '@/config/plant-filters';
import { activeFilters, matchPlantFilters, priceCounts } from '@/lib/plant-filter-match';
import { useSearchIndex } from '@/lib/search';
import { colors, space } from '@/theme';

type ExploreSheetProps = {
  initialFilters: Filters;
  /** Called once the sheet has slid away: the chosen filters, or null after Skip */
  onClose: (applied: Filters | null) => void;
};

/**
 * The home screen's quick plant filters (the short set of config/plant-filters.ts). Edits only count
 * when «Εμφάνιση φυτών» is pressed; the button says how many plants match.
 */
export function ExploreSheet({ initialFilters, onClose }: ExploreSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const appliedRef = useRef<Filters | null>(null);
  const [draft, setDraft] = useState(initialFilters);

  // Every plant, for the count and the price chart (loaded once per session)
  const { index, load } = useSearchIndex();
  useEffect(load, [load]);
  const plants = useMemo(() => index?.plants ?? [], [index]);
  const prices = useMemo(() => priceCounts(plants), [plants]);
  const matching = index && activeFilters(draft).length > 0 ? matchPlantFilters(plants, draft).matches.length : null;

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
          <ActionButtonText>{matching === null ? 'Εμφάνιση φυτών' : `Εμφάνιση φυτών (${matching})`}</ActionButtonText>
        </ActionButton>
      }>
      <View style={styles.groups}>
        {SHORT_FILTERS.map((id) => (
          <FilterSection key={id} id={id} filters={draft} onChange={setDraft} withLinked prices={prices} />
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
});
