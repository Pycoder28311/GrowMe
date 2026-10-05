import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { EFFORT, PROPAGATION, SUNLIGHT, USE, plantingPeriod, type Trait } from '@/config/plant-traits';
import type { Plant } from '@/config/plants';
import { alpha, colors, iconSize, outline, radius, shadow, space } from '@/theme';

// Fixed square photo; the details column is laid out to fit within the same height
const PHOTO_SIZE = 98;

function TraitLabel({ trait }: { trait: Trait }) {
  return (
    <AppText size="small" numberOfLines={1}>
      {trait.emoji} {trait.label}
    </AppText>
  );
}

/** One search result: photo with its planting months on the left, details on the right */
export function PlantCard({ plant }: { plant: Plant }) {
  const season = plantingPeriod(plant.months);
  const propagation = PROPAGATION[plant.propagation];

  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        <Image source={plant.image} contentFit="cover" accessibilityLabel={plant.name} style={StyleSheet.absoluteFill} />
        <View style={styles.season}>
          {/* The month emoji is muted so it reads as a quiet label on the photo */}
          <AppText size="small" style={styles.seasonEmoji}>
            {season.emoji}
          </AppText>
          <AppText size="small" bold numberOfLines={1}>
            {season.label}
          </AppText>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <AppText bold numberOfLines={1} style={styles.name}>
            {plant.name}
          </AppText>
          <AppText bold color={colors.accent}>
            {plant.price.min}–{plant.price.max} €
          </AppText>
        </View>

        <View style={styles.traits}>
          <TraitLabel trait={SUNLIGHT[plant.light]} />
          <TraitLabel trait={EFFORT[plant.care]} />
          <TraitLabel trait={USE[plant.use]} />
        </View>

        <View style={styles.footer}>
          <View style={styles.propagation}>
            <AppText size="small" bold color={colors.primary} numberOfLines={1}>
              {propagation.emoji} {propagation.label}
            </AppText>
          </View>
          <PressableScale accessibilityRole="button" style={styles.more}>
            <AppText size="small" bold color={colors.primary}>
              Δες περισσότερα
            </AppText>
            <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: outline,
    backgroundColor: alpha(colors.surface, 0.95),
    boxShadow: shadow.card,
  },
  photo: {
    width: PHOTO_SIZE,
    minHeight: PHOTO_SIZE,
  },
  season: {
    position: 'absolute',
    left: space.xs,
    right: space.xs,
    bottom: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.full,
    backgroundColor: alpha(colors.surface, 0.9),
    paddingHorizontal: space.xs,
  },
  seasonEmoji: {
    opacity: 0.7,
  },
  details: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: space.xs,
    padding: space.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  name: {
    flexShrink: 1,
  },
  traits: {
    flexDirection: 'row',
    gap: space.xs,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
  },
  propagation: {
    flexShrink: 1,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
