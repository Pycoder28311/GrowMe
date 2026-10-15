import type { SearchBlog, SearchPlant } from '@growme/shared';
import { Image } from 'expo-image';
import { useId } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PlantBackground } from '@/components/plants/plant-background';
import { EDGE_BORDER, FADE, FADE_COLOR, PHOTO_HEADER_HEIGHT, PHOTO_HEIGHT } from '@/components/plants/photo-header';
import { AppText } from '@/components/ui/app-text';
import { Skeleton } from '@/components/ui/skeleton';
import { colors, radius, size, space } from '@/theme';

/** Photo height at the top of an article (its page and the loading page share it) */
export const BLOG_PHOTO_HEIGHT = size.touch * 4;

/**
 * A plant's page before its data is here: what the tapped result already knows (photo, name, scientific
 * name) exactly where the real page puts it, and gray bars where the rest will be. The zoom from a search
 * result opens onto the same thing, so the page then loads in without a jump.
 */
export function PlantSkeleton({ plant, topClearance }: { plant?: SearchPlant; topClearance: number }) {
  const width = useWindowDimensions().width;
  const fadeId = `skeleton-fade-${useId().replace(/:/g, '')}`;
  // A plant known to have no photo starts under the corner buttons, like its page
  const noPhoto = !!plant && !plant.image;
  return (
    <View style={styles.plant}>
      <PlantBackground />
      {noPhoto ? (
        <View style={{ height: topClearance - space.lg }} />
      ) : (
        <View style={{ height: PHOTO_HEADER_HEIGHT }}>
          {plant?.image ? (
            <Image source={{ uri: plant.image }} contentFit="cover" style={{ width, height: PHOTO_HEIGHT }} />
          ) : (
            <Skeleton height={PHOTO_HEIGHT} style={styles.square} />
          )}
          {/* The photo melts into the page, as on the real page */}
          <Svg pointerEvents="none" width={width} height={FADE} style={[styles.fade, { top: PHOTO_HEIGHT - FADE }]}>
            <Defs>
              <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={FADE_COLOR} stopOpacity={0} />
                <Stop offset="0.7" stopColor={FADE_COLOR} stopOpacity={0.85} />
                <Stop offset="1" stopColor={FADE_COLOR} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={FADE} fill={`url(#${fadeId})`} />
          </Svg>
          <View pointerEvents="none" style={[styles.edge, { top: PHOTO_HEIGHT - EDGE_BORDER }]} />
        </View>
      )}

      <View style={styles.block}>
        <View>
          <View style={styles.titleRow}>
            {plant ? (
              <AppText size="big" bold style={styles.name}>
                {plant.name}
              </AppText>
            ) : (
              <Skeleton width="55%" height={30} />
            )}
            <Skeleton width={72} height={34} style={styles.pill} />
          </View>
          {plant ? (
            <AppText color={colors.inkMuted} style={styles.scientific}>
              {plant.scientificName}
            </AppText>
          ) : (
            <Skeleton width="40%" height={16} style={styles.scientificBar} />
          )}
        </View>
        {/* The months, the characteristics tiles, the sun bar and the trait rows */}
        <Skeleton height={44} style={styles.round} />
        <View style={styles.tiles}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="48%" height={88} style={styles.round} />
          ))}
        </View>
        <Skeleton height={120} style={styles.round} />
        <Skeleton height={16} width="70%" />
        <Skeleton height={16} width="85%" />
      </View>
    </View>
  );
}

/** An article's page before its data is here (see PlantSkeleton): its photo, name, and gray bars */
export function BlogSkeleton({ blog, topClearance }: { blog?: SearchBlog; topClearance: number }) {
  const width = useWindowDimensions().width;
  const noPhoto = !!blog && !blog.image;
  return (
    <View>
      {noPhoto ? (
        <View style={{ height: topClearance }} />
      ) : blog?.image ? (
        <Image source={{ uri: blog.image }} contentFit="cover" style={{ width, height: BLOG_PHOTO_HEIGHT }} />
      ) : (
        <Skeleton height={BLOG_PHOTO_HEIGHT} style={styles.square} />
      )}
      <View style={styles.blogBody}>
        <View style={styles.blogTitleRow}>
          <View style={styles.blogTitle}>
            {blog ? (
              <AppText size="big" bold>
                {blog.name}
              </AppText>
            ) : (
              <Skeleton width="70%" height={26} />
            )}
            <Skeleton width={96} height={14} style={styles.date} />
          </View>
          <Skeleton width={size.touch / 1.5} height={size.touch / 1.5} />
        </View>
        {/* The text */}
        {[100, 92, 97, 60, 100, 88, 95].map((w, i) => (
          <Skeleton key={i} width={`${w}%`} height={14} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plant: {
    flex: 1,
    backgroundColor: colors.page,
  },
  square: {
    borderRadius: 0,
  },
  fade: {
    position: 'absolute',
    left: 0,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: EDGE_BORDER,
    backgroundColor: colors.surface,
  },
  round: {
    borderRadius: radius.md,
  },
  block: {
    gap: space.lg,
    paddingHorizontal: space.md,
    paddingTop: space.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  // The same sizes as the real page's name and scientific name
  name: {
    flexShrink: 1,
    fontSize: 30,
    lineHeight: 36,
  },
  scientific: {
    fontSize: 16,
    lineHeight: 22,
  },
  scientificBar: {
    marginVertical: 3,
  },
  pill: {
    borderRadius: radius.full,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.sm,
  },
  blogBody: {
    gap: space.md,
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
  blogTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  blogTitle: {
    flex: 1,
    gap: space.xs,
  },
  date: {
    marginVertical: 3,
  },
});
