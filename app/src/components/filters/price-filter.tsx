import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import type { PriceOption } from '@/config/plant-filters';
import { space } from '@/theme';

type PriceFilterProps = {
  options: PriceOption[];
  /** Ids of the chosen ranges */
  selected: string[];
  onToggle: (optionId: string) => void;
};

/** The price ranges to pick from */
export function PriceFilter({ options, selected, onToggle }: PriceFilterProps) {
  return (
    <View style={styles.options}>
      {options.map((option) => (
        <Chip key={option.id} label={option.label} selected={selected.includes(option.id)} onToggle={() => onToggle(option.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
