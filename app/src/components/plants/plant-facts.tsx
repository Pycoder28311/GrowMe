import { durationLabel, visibleFlags, type PlantSummary } from "@growme/shared";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { LinkedText } from "@/components/ui/linked-text";
import { card } from "@/components/ui/styles";
import {
  effortTrait,
  originTrait,
  seasonTrait,
  sunlightHoursLabel,
  sunlightTrait,
  type Trait,
} from "@/config/plant-traits";
import { colors, radius, space } from "@/theme";

function FactRow({ trait }: { trait: Trait }) {
  return (
    <View style={styles.factRow}>
      <AppText style={styles.emoji}>{trait.emoji}</AppText>
      <LinkedText>{trait.label}</LinkedText>
    </View>
  );
}

/** Light-green strip with one fact in a sentence (how it grows, where it comes from, climate) */
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

/** The plant's main characteristics at a glance (only those it has values for) */
export function PlantFacts({ plant }: { plant: PlantSummary }) {
  const sun = sunlightTrait(plant);
  const sunHours = sunlightHoursLabel(plant);
  const season = seasonTrait(plant);
  const lifespan = durationLabel(plant.lifespan);
  const rows = [
    sun && { ...sun, label: sunHours ?? sun.label },
    effortTrait(plant),
    season && { emoji: season.emoji, label: `Φύτεμα: ${season.label}` },
    lifespan && { emoji: "⏳", label: `Ζει ${lifespan}` },
  ].filter((trait): trait is Trait => !!trait);
  // Where it comes from, as a sentence under the card
  const origin = originTrait(plant);
  const flags = visibleFlags(plant);

  return (
    <View style={styles.root}>
      {flags.length > 0 && (
        <View style={styles.chips}>
          {flags.map((flag) => (
            <View key={flag.key} style={styles.chip}>
              <AppText size="small" color={colors.primary}>
                {flag.emoji} {flag.label}
              </AppText>
            </View>
          ))}
        </View>
      )}
      <View style={styles.card}>
        {rows.map((trait) => (
          <FactRow key={trait.label} trait={trait} />
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
  // The yes/no characteristics (plan 09 moves them under the scientific name)
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
  },
  chip: {
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  factRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  emoji: {
    width: space.lg,
    textAlign: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
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
