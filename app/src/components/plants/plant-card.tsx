import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MonthsPill } from '@/components/plants/months-pill';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import { stripBlogLinks, type PlantSummary, type SearchPlant } from '@growme/shared';
import { FACT_ICONS, FLAG_ICONS, type PlantIcon } from '@/config/plant-icons';
import {
  effortTrait,
  originTrait,
  priceLabel,
  sunlightTrait,
  useTrait,
  type Trait,
} from '@/config/plant-traits';
import { alpha, colors, iconSize, radius, space } from '@/theme';

// Fixed square photo; the details column is laid out to fit within the same height
const PHOTO_SIZE = 98;

/** One field on the card: its icon (no emoji), then the words */
function TraitLabel({ trait, icon }: { trait: Trait; icon: PlantIcon }) {
  return (
    <View style={styles.trait}>
      <Icon name={icon.icon} size={14} color={colors.inkMuted} bold />
      <AppText size="small" numberOfLines={1} style={styles.traitText}>
        {stripBlogLinks(trait.label)}
      </AppText>
    </View>
  );
}

/** What a card shows: from the plants list (PlantSummary) or the search index (SearchPlant) */
export type PlantCardData = Pick<
  PlantSummary,
  | 'id'
  | 'name'
  | 'scientificName'
  | 'priceMin'
  | 'priceMax'
  | 'difficulty'
  | 'sunStart'
  | 'sunEnd'
  | 'monthRanges'
  | 'food'
  | 'native'
> & { cover: string | null };

export const cardFromSummary = (plant: PlantSummary): PlantCardData => ({ ...plant, cover: plant.images[0]?.url ?? null });
export const cardFromIndex = (plant: SearchPlant): PlantCardData => ({ ...plant, cover: plant.image });

/** One search result: photo with its planting months on the left, details on the right. Opens the plant's page. */
export function PlantCard({ plant }: { plant: PlantCardData }) {
  const price = priceLabel(plant);
  const cover = plant.cover;
  // Only the fields this plant has values for, each with its icon (the card never shows wind)
  const traits = [
    [sunlightTrait(plant), FACT_ICONS.sun],
    [effortTrait(plant), FACT_ICONS.difficulty],
    [useTrait(plant), FLAG_ICONS.food],
    [originTrait(plant), FACT_ICONS.origin],
  ].filter((pair): pair is [Trait, PlantIcon] => pair[0] !== null);

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
            source={{ uri: cover }}
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
        {plant.monthRanges.length > 0 && (
          <View style={styles.season}>
            <MonthsPill ranges={plant.monthRanges} />
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
          {traits.map(([trait, icon]) => (
            <TraitLabel key={trait.label} trait={trait} icon={icon} />
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
  trait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  traitText: {
    flexShrink: 1,
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
