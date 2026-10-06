import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { card } from '@/components/ui/styles';
import type { PlantDetails } from '@/config/plant-details';
import { EFFORT, PROPAGATION, SUNLIGHT, USE, type Trait } from '@/config/plant-traits';
import type { Plant } from '@/config/plants';
import { colors, radius, space } from '@/theme';

function FactRow({ trait }: { trait: Trait }) {
  return (
    <View style={styles.factRow}>
      <AppText style={styles.emoji}>{trait.emoji}</AppText>
      <AppText>{trait.label}</AppText>
    </View>
  );
}

/** Light-green strip with one fact in a sentence (how it grows, where it comes from, climate) */
function InfoPill({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.pill}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText color={colors.primary} style={styles.pillText}>
        {text}
      </AppText>
    </View>
  );
}

/** The plant's main characteristics at a glance */
export function PlantFacts({ plant, details }: { plant: Plant; details: PlantDetails }) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <FactRow trait={SUNLIGHT[plant.light]} />
        <FactRow trait={EFFORT[plant.care]} />
        <FactRow trait={USE[plant.use]} />
        <FactRow trait={{ emoji: '🪴', label: details.potSize }} />
      </View>

      <InfoPill emoji={PROPAGATION[plant.propagation].emoji} text={details.growing} />
      <InfoPill emoji="📍" text={details.nativeTo} />
      <InfoPill emoji="🌡️" text={details.climate} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
  card: {
    ...card,
    gap: space.sm,
    padding: space.md,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  emoji: {
    width: space.lg,
    textAlign: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  pillText: {
    flex: 1,
  },
});
