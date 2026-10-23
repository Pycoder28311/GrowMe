import type { PostPlant } from '@growme/shared';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, botanical, colors, iconSize, radius, space } from '@/theme';

const THUMB = 24;

/**
 * The plant a post is about, as a small green pill: its photo (or 🪴) and name. `onPress` opens it;
 * `onRemove` adds an × that unlinks it (the question form).
 */
export function PlantBadge({ plant, onPress, onRemove, lifted }: { plant: PostPlant; onPress?: () => void; onRemove?: () => void; lifted?: boolean }) {
  const content = (
    <>
      {plant.image ? (
        <Image source={{ uri: plant.image }} contentFit="cover" style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.noThumb]}>
          <AppText size="small">🪴</AppText>
        </View>
      )}
      <AppText size="small" bold color={colors.primary} numberOfLines={1} style={styles.name}>
        {plant.name}
      </AppText>
    </>
  );

  return (
    <View style={styles.row}>
      {onPress ? (
        <PressableScale
          accessibilityRole="link"
          accessibilityLabel={`Φυτό: ${plant.name}`}
          onPress={onPress}
          style={[styles.pill, lifted && styles.lifted]}>
          {content}
          <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
        </PressableScale>
      ) : (
        <View style={[styles.pill, lifted && styles.lifted]}>
          {content}
          {onRemove && (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Αφαίρεση φυτού ${plant.name}`}
              onPress={onRemove}
              hitSlop={space.sm}
              style={styles.remove}>
              <Icon name="close" size={iconSize.small} color={colors.primary} bold />
            </PressableScale>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // The pill only as wide as its content
  row: {
    flexDirection: 'row',
  },
  pill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    paddingVertical: space.xs,
    paddingLeft: space.xs,
    paddingRight: space.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  // A soft shadow all around the pill
  lifted: {
    boxShadow: `0 0 10px 1px ${alpha(botanical.ink, 0.22)}`,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  noThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flexShrink: 1,
  },
  remove: {
    marginLeft: space.xs,
  },
});
