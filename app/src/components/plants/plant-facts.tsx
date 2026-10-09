import { durationLabel, type PlantSummary } from '@growme/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconCircle } from '@/components/plants/icon-circle';
import { SunGraph } from '@/components/plants/sun-graph';
import { LinkedText } from '@/components/ui/linked-text';
import { ShakeOnTap } from '@/components/ui/shake-on-tap';
import { card } from '@/components/ui/styles';
import { FACT_ICONS, type PlantIcon } from '@/config/plant-icons';
import { effortTrait, originTrait, seasonTrait, sunlightTrait } from '@/config/plant-traits';
import { colors, radius, space } from '@/theme';

/** One fact: its icon, then the text (or the sun graph); a tap only shakes it */
function FactRow({ icon, children }: { icon: PlantIcon; children: ReactNode }) {
  return (
    <ShakeOnTap>
      <View style={styles.factRow}>
        <IconCircle icon={icon} size={28} />
        <View style={styles.factBody}>{children}</View>
      </View>
    </ShakeOnTap>
  );
}

/** The plant's main facts at a glance (only those it has values for): sun, difficulty, seasons, lifespan */
export function PlantFacts({ plant }: { plant: PlantSummary }) {
  const sun = sunlightTrait(plant);
  const season = seasonTrait(plant);
  const lifespan = durationLabel(plant.lifespan);
  const origin = originTrait(plant);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        {sun && (
          <FactRow icon={FACT_ICONS.sun}>
            <SunGraph start={plant.sunStart} end={plant.sunEnd} />
          </FactRow>
        )}
        <FactRow icon={FACT_ICONS.difficulty}>
          <LinkedText>{`Δυσκολία: ${effortTrait(plant).label}`}</LinkedText>
        </FactRow>
        {season && (
          <FactRow icon={FACT_ICONS.season}>
            <LinkedText>{`Φύτεμα: ${season.label}`}</LinkedText>
          </FactRow>
        )}
        {lifespan && (
          <FactRow icon={FACT_ICONS.lifespan}>
            <LinkedText>{`Ζει ${lifespan}`}</LinkedText>
          </FactRow>
        )}
      </View>

      {/* Where it comes from, as a sentence under the card */}
      {origin && (
        <ShakeOnTap>
          <View style={styles.pill}>
            <IconCircle icon={FACT_ICONS.origin} size={28} />
            <LinkedText color={colors.primary} style={styles.factBody}>
              {origin.label}
            </LinkedText>
          </View>
        </ShakeOnTap>
      )}
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
  factBody: {
    flex: 1,
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
});
