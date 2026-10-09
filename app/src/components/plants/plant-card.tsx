import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { stripBlogLinks, type PlantSummary } from '@growme/shared';
import {
  effortTrait,
  originTrait,
  priceLabel,
  seasonTrait,
  sunlightTrait,
  useTrait,
  type Trait,
} from '@/config/plant-traits';
import { alpha, colors, iconSize, radius, space } from '@/theme';

// Fixed square photo; the details column is laid out to fit within the same height
const PHOTO_SIZE = 98;

function TraitLabel({ trait }: { trait: Trait }) {
  return (
    <AppText size="small" numberOfLines={1}>
      {trait.emoji} {stripBlogLinks(trait.label)}
    </AppText>
  );
}

/** One search result: photo with its planting months on the left, details on the right. Opens the plant's page. */
export function PlantCard({ plant }: { plant: PlantSummary }) {
  const season = seasonTrait(plant);
  const price = priceLabel(plant);
  const cover = plant.images[0];
  // Only the labels this plant has values for
  const traits = [sunlightTrait(plant), effortTrait(plant), useTrait(plant), originTrait(plant)].filter(
    (t): t is Trait => t !== null,
  );

  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={plant.name}
      onPress={() => router.push({ pathname: '/plants/[id]', params: { id: String(plant.id) } })}
      pressedScale={0.98}
      style={styles.card}>
      <View style={styles.photo}>
        {cover ? (
          <Image
            source={{ uri: cover.url }}
            contentFit="cover"
            transition={150}
            accessibilityLabel={plant.name}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.noPhoto}>
            <AppText size="big">🪴</AppText>
          </View>
        )}
        {season && (
          <View style={styles.season}>
            {/* The month emoji is muted so it reads as a quiet label on the photo */}
            <AppText size="small" style={styles.seasonEmoji}>
              {season.emoji}
            </AppText>
            <AppText size="small" bold numberOfLines={1}>
              {season.label}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <AppText bold numberOfLines={1} style={styles.name}>
            {plant.name}
          </AppText>
          {price && (
            <AppText bold color={colors.accent}>
              {price}
            </AppText>
          )}
        </View>

        <View style={styles.traits}>
          {traits.map((trait) => (
            <TraitLabel key={trait.label} trait={trait} />
          ))}
        </View>

        <View style={styles.footer}>
          {/* Looks like a link; the whole card is the tap target */}
          <View style={styles.more}>
            <AppText size="small" bold color={colors.primary}>
              Δες περισσότερα
            </AppText>
            <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    flexDirection: 'row',
    overflow: 'hidden',
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
  noPhoto: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
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
  // Wraps: the texts come from the dashboard and can be long (e.g. «📍 Ιθαγενές της Μεσογείου»)
  traits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: space.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
