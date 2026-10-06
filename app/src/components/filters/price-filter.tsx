import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Histogram } from '@/components/ui/histogram';
import { PRICE_COUNTS, PRICE_MAX, PRICE_STEP, priceInOptions, type PriceOption } from '@/config/results-filters';
import { space } from '@/theme';

type PriceFilterProps = {
  options: PriceOption[];
  /** Ids of the chosen ranges (several allowed) */
  selected: string[];
  onToggle: (optionId: string) => void;
};

/** How plants are spread over prices, with ranges to pick; the bars inside the picked ranges stand out */
export function PriceFilter({ options, selected, onToggle }: PriceFilterProps) {
  const chosen = options.filter((option) => selected.includes(option.id));

  return (
    <View style={styles.root}>
      <Histogram
        values={PRICE_COUNTS}
        isHighlighted={chosen.length ? (index) => priceInOptions(index * PRICE_STEP, chosen) : undefined}
        labels={['0 €', `${Math.round(PRICE_MAX / 2)} €`, `${PRICE_MAX} €`]}
        accessibilityLabel={`Κατανομή τιμών από 0 έως ${PRICE_MAX} ευρώ`}
      />
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
