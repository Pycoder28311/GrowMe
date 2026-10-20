import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { RangeSlider } from '@/components/ui/range-slider';
import { SUN_MAX, SUN_MIN, type SunRange } from '@/config/section-filters';
import { colors, fontFamily, fontSize, radius, space } from '@/theme';

const TICKS = [6, 9, 12, 15, 18, 21];

/** A small box with an hour in it: write a number, and it is kept (between the bar's ends) when you leave it */
function HourInput({ label, value, onCommit }: { label: string; value: number; onCommit: (hour: number) => void }) {
  // The text being typed; null while not editing, when the box shows the bar's hour
  const [editing, setEditing] = useState<string | null>(null);

  const commit = () => {
    const hour = parseInt(editing ?? '', 10);
    if (!Number.isNaN(hour)) onCommit(Math.min(SUN_MAX, Math.max(SUN_MIN, hour)));
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

/** One sunlight bar: two small inputs above (from, to), and the draggable range from 6 am to 9 pm under them */
export function SunRangeFilter({ title, value, onChange }: { title: string; value: SunRange; onChange: (value: SunRange) => void }) {
  const [from, to] = value;
  return (
    <View style={styles.root}>
      <AppText bold>{title}</AppText>
      <View style={styles.inputs}>
        <HourInput label="Από" value={from} onCommit={(hour) => onChange([Math.min(hour, to), to])} />
        <HourInput label="Έως" value={to} onCommit={(hour) => onChange([from, Math.max(hour, from)])} />
      </View>
      <RangeSlider min={SUN_MIN} max={SUN_MAX} value={value} onChange={onChange} ticks={TICKS} label={title} />
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
