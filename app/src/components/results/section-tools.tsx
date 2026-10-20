import { StyleSheet, TextInput, View } from 'react-native';

import { FiltersButton } from '@/components/filters/filters-button';
import { Icon } from '@/components/ui/icon';
import { raisedTile } from '@/components/ui/styles';
import { alpha, colors, fontFamily, fontSize, iconSize, radius, size, space } from '@/theme';

type SectionToolsProps = {
  /** Read by screen readers and shown while empty, e.g. «Αναζήτηση στον εσωτερικό χώρο» */
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  /** The search bar was tapped */
  onSearchFocus?: () => void;
  /** The filter button was pressed */
  onFilters?: () => void;
  /** How many filters are chosen (a badge on the button when more than 0) */
  filterCount?: number;
};

/** A search bar on the left (its faint magnifier inside) and the green «Φίλτρα» button on the right, under a section's label */
export function SectionTools({ placeholder, value, onChangeText, onSearchFocus, onFilters, filterCount = 0 }: SectionToolsProps) {
  return (
    <View style={styles.row}>
      <View accessibilityRole="search" style={[raisedTile, styles.bar]}>
        <View pointerEvents="none" style={styles.icon}>
          <Icon name="search" size={iconSize.big} color={colors.inkMuted} style={styles.faint} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onSearchFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          accessibilityLabel={placeholder}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.input}
        />
      </View>
      <FiltersButton onPress={onFilters} count={filterCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // raisedTile is a square: this one stretches across what the filter button leaves
  bar: {
    flex: 1,
    width: undefined,
    height: size.touch,
    backgroundColor: alpha(colors.surface, 0.97),
  },
  icon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faint: {
    opacity: 0.55,
  },
  input: {
    ...StyleSheet.absoluteFill,
    paddingLeft: size.touch,
    paddingRight: space.md,
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    borderRadius: radius.sm,
  },
});
