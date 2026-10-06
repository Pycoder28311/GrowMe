import { useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FiltersButton } from '@/components/filters/filters-button';
import { PriceFilter } from '@/components/filters/price-filter';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { PillButton } from '@/components/ui/pill-button';
import { RadioButton } from '@/components/ui/radio-button';
import { Section } from '@/components/ui/section';
import { StepSlider } from '@/components/ui/step-slider';
import { RESULTS_FILTERS, type FilterSectionConfig } from '@/config/results-filters';
import { space } from '@/theme';

/** Where the Filters button sits on screen (from measureInWindow) */
export type ButtonFrame = { x: number; y: number; width: number; height: number };

/** Selections by section id: option ids (checkboxes, price), one option id (radio) or a number (steps) */
type FilterValues = Record<string, string[] | string | number>;

type FilterSheetProps = {
  /** The Filters button's frame: the Submit button is drawn exactly there, so it looks like the same button */
  buttonFrame: ButtonFrame;
  onClose: () => void;
};

/**
 * The results page's filters, sliding up from below. Selections are kept only while it is open
 * (not applied to the list yet).
 */
export function FilterSheet({ buttonFrame, onClose }: FilterSheetProps) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const screenHeight = useWindowDimensions().height;
  const [values, setValues] = useState<FilterValues>({});

  const listOf = (id: string) => (Array.isArray(values[id]) ? (values[id] as string[]) : []);
  const set = (id: string, value: FilterValues[string]) => setValues((current) => ({ ...current, [id]: value }));
  const toggle = (id: string, optionId: string) => {
    const selected = listOf(id);
    set(id, selected.includes(optionId) ? selected.filter((o) => o !== optionId) : [...selected, optionId]);
  };

  const renderSection = (section: FilterSectionConfig) => {
    switch (section.type) {
      case 'price':
        return (
          <PriceFilter options={section.options} selected={listOf(section.id)} onToggle={(o) => toggle(section.id, o)} />
        );
      case 'checkboxes':
        return section.options.map((option) => (
          <Checkbox
            key={option.id}
            label={option.label}
            checked={listOf(section.id).includes(option.id)}
            onToggle={() => toggle(section.id, option.id)}
          />
        ));
      case 'radio':
        return (
          <View accessibilityRole="radiogroup">
            {section.options.map((option) => (
              <RadioButton
                key={option.id}
                label={option.label}
                selected={values[section.id] === option.id}
                onSelect={() => set(section.id, option.id)}
              />
            ))}
          </View>
        );
      case 'steps':
        return (
          <StepSlider
            stops={section.stops}
            value={typeof values[section.id] === 'number' ? (values[section.id] as number) : section.stops[0]}
            onChange={(value) => set(section.id, value)}
            label={section.label}
          />
        );
      case 'suggestions':
        return (
          <View style={styles.suggestions}>
            {section.options.map((option) => (
              <PillButton key={option.id} label={option.label} />
            ))}
          </View>
        );
      case 'more':
        // Only the title for now: the remaining filters will go here
        return null;
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      title="Φίλτρα"
      initialSnap="full"
      onClose={onClose}
      // Lets the last section scroll above the Submit button
      contentBottomInset={screenHeight - buttonFrame.y}
      floating={
        <FiltersButton
          submit
          onPress={() => sheetRef.current?.close()}
          style={[styles.submit, { left: buttonFrame.x, top: buttonFrame.y, width: buttonFrame.width }]}
        />
      }>
      <View style={styles.sections}>
        {RESULTS_FILTERS.map((section) => (
          <Section key={section.id} title={section.label}>
            {renderSection(section)}
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
  suggestions: {
    gap: space.sm,
  },
  submit: {
    position: 'absolute',
  },
});
