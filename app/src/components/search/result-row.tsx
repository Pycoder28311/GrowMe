import { BLOG_KIND_LABELS, type SearchBlog, type SearchPlant } from '@growme/shared';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, size, space } from '@/theme';

export type SearchResult = { type: 'plant'; item: SearchPlant } | { type: 'blog'; item: SearchBlog };

const THUMB = size.touch;

/** What a result shows: cover (or an emoji), name, and the scientific name or the blog's kind */
export function ResultRowContent({ result }: { result: SearchResult }) {
  const { item } = result;
  return (
    <View style={styles.row}>
      {item.image ? (
        <Image source={{ uri: item.image }} contentFit="cover" style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.noThumb]}>
          <AppText>{result.type === 'plant' ? '🪴' : '📖'}</AppText>
        </View>
      )}
      <View style={styles.text}>
        <AppText bold numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText size="small" color={colors.inkMuted} numberOfLines={1} style={result.type === 'plant' && styles.italic}>
          {result.type === 'plant' ? result.item.scientificName : BLOG_KIND_LABELS[result.item.kind]}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.xs,
    borderRadius: radius.xs,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.xs - 2,
    backgroundColor: colors.primarySoft,
  },
  noThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  italic: {
    fontStyle: 'italic',
  },
});
