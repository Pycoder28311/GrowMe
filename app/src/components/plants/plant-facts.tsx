import { durationLabel, type PlantSummary } from '@growme/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SunGraph } from '@/components/plants/sun-graph';
import { AppText } from '@/components/ui/app-text';
import { LinkedText } from '@/components/ui/linked-text';
import { card } from '@/components/ui/styles';
import { effortTrait, originTrait, seasonTrait, sunlightTrait, type Trait } from '@/config/plant-traits';
import { colors, radius, space } from '@/theme';

function FactRow({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <View style={styles.factRow}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      {children}
    </View>
  );
}

/** Light-green strip with one fact in a sentence (where it comes from) */
function InfoPill({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.pill}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <LinkedText color={colors.primary} style={styles.pillText}>
        {text}
      </LinkedText>
    </View>
  );
}

/** The plant's main facts at a glance (only those it has values for): sun, difficulty, seasons, lifespan */
export function PlantFacts({ plant }: { plant: PlantSummary }) {
  const sun = sunlightTrait(plant);
  const season = seasonTrait(plant);
  const lifespan = durationLabel(plant.lifespan);
  const rows = [
    effortTrait(plant),
    season && { emoji: season.emoji, label: `Φύτεμα: ${season.label}` },
    lifespan && { emoji: '⏳', label: `Ζει ${lifespan}` },
  ].filter((trait): trait is Trait => !!trait);
  // Where it comes from, as a sentence under the card
  const origin = originTrait(plant);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        {sun && (
          <FactRow emoji={sun.emoji}>
            <SunGraph start={plant.sunStart} end={plant.sunEnd} />
          </FactRow>
        )}
        {rows.map((trait) => (
          <FactRow key={trait.label} emoji={trait.emoji}>
            <LinkedText>{trait.label}</LinkedText>
          </FactRow>
        ))}
      </View>

      {origin && <InfoPill emoji={origin.emoji} text={origin.label} />}
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
