import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { BottomComposer } from '@/components/discussion/bottom-composer';
import { DiscussionItem } from '@/components/discussion/discussion-item';
import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { card } from '@/components/ui/styles';
import { countReplies, type CommunityPost } from '@/config/community-posts';
import { useCommunity } from '@/lib/community';
import { colors, space } from '@/theme';

// Tapping the sort button switches between the two orders
const SORTS = {
  recent: { label: 'Πιο πρόσφατα', compare: (a: CommunityPost, b: CommunityPost) => b.createdAt - a.createdAt },
  popular: { label: 'Δημοφιλή', compare: (a: CommunityPost, b: CommunityPost) => b.likeCount - a.likeCount },
};

const openPost = (id: string) => router.push({ pathname: '/community/[id]', params: { id } });

/** Users' questions and posts, newest or most liked first, with a field to write a new one */
export default function CommunityScreen() {
  const topClearance = useTopClearance();
  const { posts, addPost } = useCommunity();
  const [sort, setSort] = useState<keyof typeof SORTS>('recent');
  const sorted = [...posts].sort(SORTS[sort].compare);

  return (
    <View style={styles.page}>
      <FlatList
        data={sorted}
        keyExtractor={(post) => post.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText size="big" bold accessibilityRole="header">
              Αναρτήσεις
            </AppText>
            <PillButton label={SORTS[sort].label} onPress={() => setSort(sort === 'recent' ? 'popular' : 'recent')} />
          </View>
        }
        renderItem={({ item }) => (
          <DiscussionItem
            author={item.author}
            date={item.date}
            text={item.text}
            likeCount={item.likeCount}
            replyCount={countReplies(item)}
            onPress={() => openPost(item.id)}
            style={styles.post}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListEmptyComponent={
          <AppText color={colors.inkMuted} style={styles.empty}>
            Γράψε την πρώτη ανάρτηση!
          </AppText>
        }
        contentContainerStyle={[styles.list, { paddingTop: topClearance }]}
      />
      {/* The new post goes to the top of the list */}
      <BottomComposer
        placeholder="Η ανάρτησή σου..."
        onSend={(text) => {
          addPost(text);
          setSort('recent');
        }}
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
    paddingBottom: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  post: {
    ...card,
    padding: space.md,
  },
  gap: {
    height: space.sm,
  },
  empty: {
    marginTop: space.lg,
    textAlign: 'center',
  },
});
