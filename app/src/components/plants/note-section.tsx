import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FlatFlower, PaperGrain, TILE_SHAPES } from '@/components/ui/flower-shapes';
import { Icon } from '@/components/ui/icon';
import { LinkedText } from '@/components/ui/linked-text';
import { NOTES, NUTRITION_NOTES, type PlantPageData } from '@/config/plant-page';
import { botanical, iconSize, SQUARE_FLOWER_COLORS, SQUARE_TONE_ORDER, radius, sectionTitle, serif, space, tileGrain, tileTone } from '@/theme';

/**
 * A plant's short text («Ηξερες οτι», «Μυστικό επιτυχίας») as a card in the tiles' style: its warm tint with
 * paper grain and a painted flower in the corner, the icon in its accent circle beside a small uppercase
 * title, then the text in an italic serif, like a quote. Nothing when the plant has none.
 */
export function NoteSection({ plant, note }: { plant: PlantPageData; note: (typeof NOTES)[number] | (typeof NUTRITION_NOTES)[number] }) {
  const text = plant[note.key];
  if (!text) return null;
  const tone = tileTone(note.tone);
  return (
    <View style={[styles.card, { backgroundColor: tone.background }]}>
      <FlatFlower kind={TILE_SHAPES[note.tone % TILE_SHAPES.length]} size={120} color={SQUARE_FLOWER_COLORS[SQUARE_TONE_ORDER[note.tone % SQUARE_TONE_ORDER.length]]} opacity={0.85} rotate={18} style={styles.flower} />
      <PaperGrain opacity={tileGrain} />
      <View style={styles.head}>
        <View style={[styles.circle, { backgroundColor: tone.circle }]}>
          <Icon name={note.icon} size={iconSize.normal} color={tone.icon} />
        </View>
        <AppText accessibilityRole="header" color={botanical.ink} style={sectionTitle}>
          {note.title}
        </AppText>
      </View>
      <LinkedText style={styles.text}>{text}</LinkedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.sm + 2,
    padding: space.md,
    // Room on the right for the flower
    paddingRight: space.lg + space.md,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  flower: {
    right: -48,
    bottom: -44,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 26,
    color: botanical.ink,
  },
});
