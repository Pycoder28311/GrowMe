import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, size, space } from '@/theme';

type HistogramProps = {
  /** One bar per value, left to right (e.g. how many items cost 0–1 €, 1–2 €, …) */
  values: number[];
  /** Bars drawn in the strong color (e.g. inside the chosen range); all of them when omitted */
  isHighlighted?: (index: number) => boolean;
  /** Labels spread evenly under the chart (e.g. "0 €", "12 €", "24 €") */
  labels?: string[];
  /** Read by screen readers instead of the bars */
  accessibilityLabel: string;
  height?: number;
};

/** A compact bar chart that shows how values are spread, like a shop's price distribution */
export function Histogram({ values, isHighlighted, labels, accessibilityLabel, height = size.touch * 2 }: HistogramProps) {
  const max = Math.max(1, ...values);

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <View style={[styles.bars, { height }]}>
        {values.map((value, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              // Empty steps keep a thin base line so the chart reads as continuous
              { height: Math.max(space.xs / 2, (value / max) * height) },
              (isHighlighted?.(index) ?? true) ? styles.highlighted : styles.dimmed,
            ]}
          />
        ))}
      </View>
      {labels && (
        <View style={styles.labels}>
          {labels.map((label) => (
            <AppText key={label} size="small" color={colors.inkMuted}>
              {label}
            </AppText>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.xs / 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: radius.full,
    borderTopRightRadius: radius.full,
  },
  highlighted: {
    backgroundColor: colors.primary,
  },
  dimmed: {
    backgroundColor: colors.primarySoft,
  },
  labels: {
    marginTop: space.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
