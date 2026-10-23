import type { SearchBlog, SearchPlant } from '@growme/shared';
import { Image } from 'expo-image';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { BotanicalBackground } from '@/components/layout/botanical-background';
import { CURVE_HEIGHT, PHOTO_HEADER_HEIGHT, PHOTO_HEIGHT } from '@/components/plants/photo-header';
import { CurvedEdge } from '@/components/ui/flower-shapes';
import { AppText } from '@/components/ui/app-text';
import { Skeleton } from '@/components/ui/skeleton';
import { botanical, colors, radius, size, space, titleFont } from '@/theme';

/** Photo height at the top of an article (its page and the loading page share it) */
export const BLOG_PHOTO_HEIGHT = size.touch * 5.5;

/**
 * A plant's page before its data is here: what the tapped result already knows (photo, name, scientific
 * name) exactly where the real page puts it, and gray bars where the rest will be. The zoom from a search
 * result opens onto the same thing, so the page then loads in without a jump.
 */
export function PlantSkeleton({ plant, topClearance }: { plant?: SearchPlant; topClearance: number }) {
  const width = useWindowDimensions().width;
  // A plant known to have no photo starts under the corner buttons, like its page
  const noPhoto = !!plant && !plant.image;
  return (
    <View style={styles.plant}>
      <BotanicalBackground />
      {noPhoto ? (
        <View style={{ height: topClearance - space.lg }} />
      ) : (
        <View style={{ height: PHOTO_HEADER_HEIGHT }}>
          {plant?.image ? (
            <Image source={{ uri: plant.image }} contentFit="cover" style={{ width, height: PHOTO_HEIGHT }} />
          ) : (
            <Skeleton height={PHOTO_HEIGHT} style={styles.square} />
          )}
          {/* The curved line where the photo meets the page, as on the real page */}
          <View pointerEvents="none" style={[styles.photoEdge, { height: PHOTO_HEIGHT, width }]}>
            <CurvedEdge width={width} height={CURVE_HEIGHT} color={botanical.page} />
          </View>
        </View>
      )}

      <View style={styles.block}>
        <View>
          <View style={styles.titleRow}>
            {plant ? (
              <AppText size="big" bold style={[styles.name, titleFont]}>
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
              <AppText size="big" bold style={titleFont}>
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
    backgroundColor: botanical.page,
  },
  square: {
    borderRadius: 0,
  },
  photoEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
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
