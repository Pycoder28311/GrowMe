import type { ImageRef } from '@growme/shared';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet } from 'react-native';

import { colors, radius, size, space } from '@/theme';

const TILE = size.touch * 4;

/**
 * A post's photos inside its card: one photo full width, several side by side (scroll sideways).
 * `compact` (lists) shows a single small row of thumbnails.
 */
export function PostPhotos({ images, label, compact }: { images: ImageRef[]; label: string; compact?: boolean }) {
  if (images.length === 0) return null;
  if (images.length === 1 && !compact) {
    return (
      <Image
        source={{ uri: images[0].url }}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`${label}, φωτογραφία`}
        style={styles.single}
      />
    );
  }
  const tile = compact ? size.touch * 1.5 : TILE;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {images.map((image, i) => (
        <Image
          key={image.id}
          source={{ uri: image.url }}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`${label}, φωτογραφία ${i + 1} από ${images.length}`}
          style={[styles.tile, { width: tile, height: tile }]}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  single: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  row: {
    gap: space.sm,
  },
  tile: {
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
});
