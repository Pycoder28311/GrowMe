import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Histogram } from '@/components/ui/histogram';
import type { PriceOption } from '@/config/plant-filters';
import { space } from '@/theme';

type PriceFilterProps = {
  options: PriceOption[];
  /** Ids of the chosen ranges */
  selected: string[];
  onToggle: (optionId: string) => void;
  /** How many plants are sold at each whole euro (priceCounts), up to `max` euros */
  counts: number[];
  max: number;
};

/** True when a price falls inside one of the options */
const priceInOptions = (price: number, options: PriceOption[]) =>
  options.some((option) => price >= option.min && (option.max === null || price < option.max));

/** How plants are spread over prices, with ranges to pick; the bars inside the picked ranges stand out */
export function PriceFilter({ options, selected, onToggle, counts, max }: PriceFilterProps) {
  const chosen = options.filter((option) => selected.includes(option.id));

  return (
    <View style={styles.root}>
      {counts.some((count) => count > 0) && (
        <Histogram
          values={counts}
          isHighlighted={chosen.length ? (euro) => priceInOptions(euro, chosen) : undefined}
          labels={['0 €', `${Math.round(max / 2)} €`, `${max} €`]}
          accessibilityLabel={`Κατανομή τιμών από 0 έως ${max} ευρώ`}
        />
      )}
      <View style={styles.options}>
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            selected={selected.includes(option.id)}
            onToggle={() => onToggle(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.md,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
