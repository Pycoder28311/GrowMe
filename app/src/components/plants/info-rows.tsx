import { StyleSheet, View } from 'react-native';

import { IconCircle } from '@/components/plants/icon-circle';
import { LinkedText } from '@/components/ui/linked-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import type { PlantIcon } from '@/config/plant-icons';
import { colors, radius, shadow, space } from '@/theme';

export type InfoRow = { key: string; icon: PlantIcon; text: string };

/** The rows' text: bigger than the body text (16) and black */
const ROW_TEXT_SIZE = 18;
const ROW_TEXT_COLOR = '#000000';

/** White rows like the info tiles (same corner and shadow), one short sentence each; a tap only shakes them */
export function InfoRows({ rows }: { rows: readonly InfoRow[] }) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <ShakeOnTap key={row.key}>
          <View style={styles.row}>
            <IconCircle icon={row.icon} size={28} />
            <LinkedText numberOfLines={1} style={styles.text}>
              {row.text}
            </LinkedText>
          </View>
        </ShakeOnTap>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    // The icon is as far from the left edge as from the top and bottom
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    boxShadow: shadow.tile,
  },
  text: {
    flex: 1,
    fontSize: ROW_TEXT_SIZE,
    lineHeight: ROW_TEXT_SIZE * 1.3,
    color: ROW_TEXT_COLOR,
  },
});
