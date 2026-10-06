import type { PlantSummary } from '@growme/shared';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { card } from '@/components/ui/styles';
import {
  effortTrait,
  originTrait,
  propagationTrait,
  seasonTrait,
  sunlightHoursLabel,
  sunlightTrait,
  useTrait,
  type Trait,
} from '@/config/plant-traits';
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

/** The plant's main characteristics at a glance (only those it has values for) */
export function PlantFacts({ plant }: { plant: PlantSummary }) {
  const sun = sunlightTrait(plant);
  const sunHours = sunlightHoursLabel(plant);
  const season = seasonTrait(plant);
  const rows = [
    sun && { ...sun, label: sunHours ?? sun.label },
    effortTrait(plant),
    useTrait(plant),
    season && { emoji: season.emoji, label: `Φύτεμα: ${season.label}` },
  ].filter((trait): trait is Trait => !!trait);
  // How it grows and where it comes from, as sentences under the card
  const pills = [propagationTrait(plant), originTrait(plant)].filter((trait): trait is Trait => !!trait);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        {rows.map((trait) => (
          <FactRow key={trait.label} trait={trait} />
        ))}
      </View>

      {pills.map((trait) => (
        <InfoPill key={trait.label} emoji={trait.emoji} text={trait.label} />
      ))}
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
