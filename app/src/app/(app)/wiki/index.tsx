import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { CategoryTabs } from '@/components/ui/category-tabs';
import { PostCard } from '@/components/wiki/post-card';
import { WIKI_POSTS, WIKI_TABS } from '@/config/wiki-posts';
import { colors, space } from '@/theme';

/** The Encyclopedia: posts with tips and glossary entries, filtered by the tabs */
export default function WikiScreen() {
  const topClearance = useTopClearance();
  const [tabId, setTabId] = useState<string>('all');
  const posts = tabId === 'all' ? WIKI_POSTS : WIKI_POSTS.filter((post) => post.category === tabId);

  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.id}
      renderItem={({ item }) => (
        <PostCard post={item} onPress={() => router.push({ pathname: '/wiki/[id]', params: { id: item.id } })} />
      )}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListHeaderComponent={
        <View style={styles.tabs}>
          <CategoryTabs tabs={WIKI_TABS} activeId={tabId} onChange={setTabId} />
        </View>
      }
      ListEmptyComponent={
        <AppText color={colors.inkMuted} style={styles.empty}>
          Δεν υπάρχουν αναρτήσεις ακόμα.
        </AppText>
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
});
