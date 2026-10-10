import { BLOG_KIND_LABELS } from '@growme/shared';
import { Image } from 'expo-image';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { PHOTO_HEADER_HEIGHT, PHOTO_HEIGHT } from '@/components/plants/photo-header';
import type { SearchResult } from '@/components/search/result-row';
import { AppText } from '@/components/ui/app-text';
import { colors, space } from '@/theme';

/**
 * What the lens opens onto: the top of the result's page as it will look (its photo across the top,
 * then the name and the scientific name or the article's kind), screen-sized, so the real page then
 * takes over without a jump.
 */
export function LensPreview({ result }: { result: SearchResult }) {
  const { width, height } = useWindowDimensions();
  const { item } = result;
  return (
    <View style={[styles.page, { width, height }]}>
      {/* The plant page's header: its photo, and the room under it for the thumbnails */}
      <View style={{ height: PHOTO_HEADER_HEIGHT }}>
        {item.image ? (
          <Image source={{ uri: item.image }} contentFit="cover" style={{ width, height: PHOTO_HEIGHT }} />
        ) : (
          <View style={[styles.noPhoto, { height: PHOTO_HEIGHT }]}>
            <AppText size="big">{result.type === 'plant' ? '🪴' : '📖'}</AppText>
          </View>
        )}
      </View>
      <View style={styles.titles}>
        <AppText size="big" bold numberOfLines={2}>
          {item.name}
        </AppText>
        <AppText size="small" color={colors.inkMuted}>
          {result.type === 'plant' ? result.item.scientificName : BLOG_KIND_LABELS[result.item.kind]}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.surface,
  },
  noPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  // Where the page's first section starts (its sections' top gap)
  titles: {
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingTop: space.lg,
  },
});
