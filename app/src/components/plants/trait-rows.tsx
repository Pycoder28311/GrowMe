import { durationLabel, type PlantSummary } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { IconCircle } from '@/components/plants/icon-circle';
import { LinkedText } from '@/components/ui/linked-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import { FACT_ICONS, FLAG_ICONS, type PlantIcon } from '@/config/plant-icons';
import { colors, radius, shadow, space } from '@/theme';

type Row = { key: string; icon: PlantIcon; text: string };

/** The rows' text: bigger than the body text (16) and black */
const ROW_TEXT_SIZE = 18;
const ROW_TEXT_COLOR = '#000000';

/**
 * The plant's rows under the sun bar, each one short sentence: small tree, origin, near the sea,
 * privacy (only when true or set), and the lifespan when the plant has no life cycle to show it
 */
export function traitRows(plant: PlantSummary, withLifespan: boolean): Row[] {
  const lifespan = withLifespan ? durationLabel(plant.lifespan) : null;
  return [
    plant.smallTree && { key: 'smallTree', icon: FLAG_ICONS.smallTree, text: 'Μεγαλώνει σαν μικρό δέντρο' },
    plant.native && { key: 'native', icon: FACT_ICONS.origin, text: plant.native },
    plant.nearSea && { key: 'nearSea', icon: FLAG_ICONS.nearSea, text: 'Αντέχει κοντά στη θάλασσα' },
    plant.privacy && { key: 'privacy', icon: FLAG_ICONS.privacy, text: 'Κάνει φράχτη για ιδιωτικότητα' },
    lifespan && { key: 'lifespan', icon: FACT_ICONS.lifespan, text: `Ζει ${lifespan}` },
  ].filter((row): row is Row => !!row);
}

/** White rows like the info tiles (same corner and shadow), one line each (the origin may link to a blog); a tap only shakes them */
export function TraitRows({ plant, withLifespan }: { plant: PlantSummary; withLifespan: boolean }) {
  const rows = traitRows(plant, withLifespan);
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
  // A size up from the body text, in black
  text: {
    flex: 1,
    fontSize: ROW_TEXT_SIZE,
    lineHeight: ROW_TEXT_SIZE * 1.3,
    color: ROW_TEXT_COLOR,
  },
});
