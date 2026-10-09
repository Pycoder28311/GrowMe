import { StyleSheet, View } from 'react-native';

import { PriceFilter } from '@/components/filters/price-filter';
import { Chip } from '@/components/ui/chip';
import { Section } from '@/components/ui/section';
import { FILTERS, PRICE_OPTIONS, type FilterId, type Filters } from '@/config/plant-filters';
import { linkedChecked, toggleLinked, toggleOption } from '@/lib/plant-filter-match';
import { space } from '@/theme';

type FilterSectionProps = {
  id: FilterId;
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** Also the filter's linked checkboxes (the short set's «Αντέχει αέρα») */
  withLinked?: boolean;
  /** The price chart's data (priceCounts); without it the price filter shows only its ranges */
  prices?: { counts: number[]; max: number };
};

/**
 * One filter of config/plant-filters.ts with its title, as chips (single choice: tap again to clear).
 * The price filter adds its chart.
 */
export function FilterSection({ id, filters, onChange, withLinked = false, prices }: FilterSectionProps) {
  const def = FILTERS[id];
  const chosen = filters[id] ?? [];

  return (
    <Section title={def.label}>
      {id === 'price' ? (
        <PriceFilter
          options={PRICE_OPTIONS}
          selected={chosen}
          onToggle={(optionId) => onChange(toggleOption(filters, id, optionId))}
          counts={prices?.counts ?? []}
          max={prices?.max ?? 0}
        />
      ) : (
        <View style={styles.options} accessibilityRole={def.select === 'one' ? 'radiogroup' : undefined}>
          {withLinked &&
            def.linked?.map((link) => (
              <Chip
                key={link.id}
                label={link.label}
                selected={linkedChecked(filters, link)}
                onToggle={() => onChange(toggleLinked(filters, link))}
              />
            ))}
          {def.options.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={chosen.includes(option.id)}
              onToggle={() => onChange(toggleOption(filters, id, option.id))}
            />
          ))}
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
