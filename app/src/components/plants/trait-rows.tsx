import { durationLabel, type PlantSummary } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { IconCircle } from '@/components/plants/icon-circle';
import { LinkedText } from '@/components/ui/linked-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import { FACT_ICONS, FLAG_ICONS, type PlantIcon } from '@/config/plant-icons';
import { colors, radius, space } from '@/theme';

type Row = { key: string; icon: PlantIcon; text: string };

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

/** Gray rounded rows, one line each (the origin may link to a blog); a tap only shakes them */
export function TraitRows({ plant, withLifespan }: { plant: PlantSummary; withLifespan: boolean }) {
  const rows = traitRows(plant, withLifespan);
  if (rows.length === 0) return null;
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <ShakeOnTap key={row.key}>
          <View style={styles.row}>
            <IconCircle icon={row.icon} size={24} />
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
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: '#e9e9ec',
  },
  text: {
    flex: 1,
    color: colors.ink,
  },
});
