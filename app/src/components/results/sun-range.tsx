import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { RangeSlider } from '@/components/ui/range-slider';
import type { Range } from '@/config/section-filters';
import { colors, fontFamily, fontSize, radius, space } from '@/theme';

/** A small box with an hour in it: write a number, and it is kept (between the bar's ends) when you leave it */
function HourInput({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (hour: number) => void;
}) {
  // The text being typed; null while not editing, when the box shows the bar's hour
  const [editing, setEditing] = useState<string | null>(null);

  const commit = () => {
    const hour = parseInt(editing ?? '', 10);
    if (!Number.isNaN(hour)) onCommit(Math.min(max, Math.max(min, hour)));
    setEditing(null);
  };

  return (
    <View style={styles.inputGroup}>
      <AppText size="small" color={colors.inkMuted}>
        {label}
      </AppText>
      <View style={styles.box}>
        <TextInput
          value={editing ?? String(value)}
          onFocus={() => setEditing(String(value))}
          onChangeText={(next) => setEditing(next.replace(/[^0-9]/g, '').slice(0, 2))}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
          accessibilityLabel={`${label} (ώρα)`}
          style={styles.input}
        />
        <AppText size="small" color={colors.inkMuted}>
          :00
        </AppText>
      </View>
    </View>
  );
}

type SunRangeFilterProps = {
  title: string;
  value: Range;
  onChange: (value: Range) => void;
  /** The hours the bar covers, and the numbers written under it */
  min: number;
  max: number;
  ticks: number[];
};

/** One sunlight bar: two small inputs above (from, to), and the draggable range under them */
export function SunRangeFilter({ title, value, onChange, min, max, ticks }: SunRangeFilterProps) {
  const [from, to] = value;
  return (
    <View style={styles.root}>
      <AppText bold>{title}</AppText>
      <View style={styles.inputs}>
        <HourInput label="Από" value={from} min={min} max={max} onCommit={(hour) => onChange([Math.min(hour, to), to])} />
        <HourInput label="Έως" value={to} min={min} max={max} onCommit={(hour) => onChange([from, Math.max(hour, from)])} />
      </View>
      <RangeSlider min={min} max={max} value={value} onChange={onChange} ticks={ticks} label={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
  inputs: {
    flexDirection: 'row',
    gap: space.lg,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 64,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    minWidth: 24,
    padding: 0,
    textAlign: 'right',
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
