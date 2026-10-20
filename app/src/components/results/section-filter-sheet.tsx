import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SunRangeFilter } from '@/components/results/sun-range';
import { ActionButton } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Section } from '@/components/ui/section';
import { filtersFor, NO_FILTERS, type PlantFilter, type Range, type SectionId, type Selection } from '@/config/section-filters';
import { setRange, toggleOption } from '@/lib/plant-filter-match';
import { colors, space } from '@/theme';

/** The filters in sheet order, neighbours with the same `group` heading together */
function inBlocks(filters: readonly PlantFilter[]) {
  const blocks: { title: string; filters: PlantFilter[] }[] = [];
  for (const filter of filters) {
    const last = blocks[blocks.length - 1];
    if (filter.group && last?.title === filter.group) last.filters.push(filter);
    else blocks.push({ title: filter.group ?? filter.label, filters: [filter] });
  }
  return blocks;
}

const TITLES: Record<SectionId, string> = {
  indoor: 'Φίλτρα · Εσωτερικός χώρος',
  outdoor: 'Φίλτρα · Εξωτερικός χώρος',
};

type SectionFilterSheetProps = {
  section: SectionId;
  /** What is chosen now (the sheet starts from it) */
  filters: Selection;
  /** The choices, when «Υποβολή» is pressed (closing the sheet another way drops them) */
  onSubmit: (filters: Selection) => void;
  onClose: () => void;
};

/**
 * One section's filters (config/section-filters.ts), sliding up from below, each drawn by its kind: chips or a
 * range bar. A draft until «Υποβολή»; «Καθαρισμός» clears it.
 */
export function SectionFilterSheet({ section, filters, onSubmit, onClose }: SectionFilterSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [draft, setDraft] = useState<Selection>(filters);
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
        {inBlocks(filtersFor(section)).map((block) => (
          <Section key={block.title} title={block.title}>
            <View style={block.filters[0].kind === 'range' ? styles.sun : styles.options}>
              {block.filters.map((filter) =>
                filter.kind === 'range' ? (
                  <SunRangeFilter
                    key={filter.key}
                    title={filter.label}
                    min={filter.min}
                    max={filter.max}
                    ticks={filter.ticks}
                    value={(draft[filter.key] as Range | undefined) ?? [filter.min, filter.max]}
                    onChange={(range) => setDraft(setRange(draft, filter, range))}
                  />
                ) : (
                  filter.options.map((option) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      selected={((draft[filter.key] ?? []) as readonly string[]).includes(option.id)}
                      onToggle={() => setDraft(toggleOption(draft, filter, option.id))}
                    />
                  ))
                ),
              )}
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
