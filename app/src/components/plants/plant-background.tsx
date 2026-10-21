import { StyleSheet, View } from 'react-native';

import { FlowerShape, LeafShape, PaperGrain } from '@/components/ui/flower-shapes';
import { botanical } from '@/theme';

/**
 * The plant page's background, fixed behind the page as it scrolls: the botanical cream paper (a fine grain),
 * with a few faint painted flowers and a geranium leaf at its edges (the shared flower shapes)
 */
export function PlantBackground() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.page]}>
      <FlowerShape size={220} color={botanical.blush} opacity={0.55} rotate={-14} style={styles.flowerRight} />
      <LeafShape size={180} color={botanical.sand} opacity={0.7} rotate={-35} style={styles.leafLeft} />
      <FlowerShape size={160} color={botanical.butter} opacity={0.35} rotate={20} style={styles.flowerBottom} />
      <PaperGrain opacity={0.35} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: botanical.page,
    overflow: 'hidden',
  },
  flowerRight: {
    right: -80,
    top: '38%',
  },
  leafLeft: {
    left: -70,
    top: '62%',
  },
  flowerBottom: {
    right: -40,
    bottom: -50,
  },
});
