import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { BlogSkeleton, PlantSkeleton } from '@/components/search/page-skeleton';
import type { SearchResult } from '@/components/search/result-row';
import { colors } from '@/theme';

/**
 * What the lens opens onto: the top of the result's page as it will look while it loads (the same
 * PlantSkeleton / BlogSkeleton the page shows until its data arrives), screen-sized, so the real page
 * then takes over without a jump.
 */
export function LensPreview({ result }: { result: SearchResult }) {
  const { width, height } = useWindowDimensions();
  const topClearance = useTopClearance();
  return (
    <View style={[styles.page, { width, height }]}>
      {result.type === 'plant' ? (
        <PlantSkeleton plant={result.item} topClearance={topClearance} />
      ) : (
        <BlogSkeleton blog={result.item} topClearance={topClearance} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
});
