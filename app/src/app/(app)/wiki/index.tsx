import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { CategoryTabs } from '@/components/ui/category-tabs';
import { PillButton } from '@/components/ui/pill-button';
import { PostCard } from '@/components/wiki/post-card';
import { WIKI_TABS } from '@/config/wiki-posts';
import { useBlogs } from '@/lib/blogs';
import { colors, space } from '@/theme';

/**
 * The Encyclopedia: the articles from the database, newest first; more load while scrolling.
 * The tabs don't filter yet: the database has no categories so far.
 */
export default function WikiScreen() {
  const topClearance = useTopClearance();
  const [tabId, setTabId] = useState<string>('all');
  const { blogs, loading, error, loadMore, refresh } = useBlogs();

  return (
    <FlatList
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
          <CategoryTabs tabs={WIKI_TABS} activeId={tabId} onChange={setTabId} />
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
      contentContainerStyle={[styles.list, { paddingTop: topClearance }]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  tabs: {
    marginBottom: space.md,
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
