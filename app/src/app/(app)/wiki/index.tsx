import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { TopGradient } from '@/components/layout/top-gradient';
import { AppText } from '@/components/ui/app-text';
import { CategoryTabs } from '@/components/ui/category-tabs';
import { PillButton } from '@/components/ui/pill-button';
import { PostCard } from '@/components/wiki/post-card';
import { WIKI_TABS, type WikiTabId } from '@/config/wiki-posts';
import { useBlogs } from '@/lib/blogs';
import { LIST_TUNING } from '@/lib/list-tuning';
import { colors, space } from '@/theme';

/**
 * The Encyclopedia: the articles from the database, newest first; more load while scrolling. The tabs
 * (a sideways-scrolling row) show all of them or one kind.
 */
export default function WikiScreen() {
  const topClearance = useTopClearance();
  const [tabId, setTabId] = useState<WikiTabId>('all');
  const { blogs, loading, error, loadMore, refresh } = useBlogs(tabId === 'all' ? undefined : tabId);

  return (
    <View style={styles.page}>
    <TopGradient />
    <FlatList
      {...LIST_TUNING}
      data={blogs}
      keyExtractor={(post) => String(post.id)}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => router.push({ pathname: '/wiki/[id]', params: { id: String(item.id) } })}
        />
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListHeaderComponent={
        <View style={styles.tabs}>
          <CategoryTabs variant="scroll" tabs={WIKI_TABS} activeId={tabId} onChange={(id) => setTabId(id as WikiTabId)} />
        </View>
      }
      ListEmptyComponent={
        loading || error ? null : (
          <AppText color={colors.inkMuted} style={styles.empty}>
            Δεν υπάρχουν αναρτήσεις ακόμα.
          </AppText>
        )
      }
      ListFooterComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} style={styles.footer} />
        ) : error ? (
          <View style={styles.footer}>
            <AppText color={colors.inkMuted} style={styles.empty}>
              Δεν ήταν δυνατή η φόρτωση των άρθρων.
            </AppText>
            <PillButton label="Δοκίμασε ξανά" onPress={blogs.length ? loadMore : refresh} />
          </View>
        ) : null
      }
      // The tabs sit as far under the corner buttons as the first article is under them
      contentContainerStyle={[styles.list, { paddingTop: topClearance + space.md - space.sm }]}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  list: {
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  // Plus the tabs' own bottom padding: as far below them as they are under the corner buttons
  tabs: {
    marginBottom: space.sm,
  },
  gap: {
    height: space.md,
  },
  empty: {
    marginTop: space.lg,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
});
