import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { Section } from '@/components/ui/section';
import { CommentsSection } from '@/components/wiki/comments-section';
import { PostBody } from '@/components/wiki/post-body';
import { PostCarousel } from '@/components/wiki/post-carousel';
import { ReadTimeBadge } from '@/components/wiki/read-time-badge';
import { ShareButtons } from '@/components/wiki/share-buttons';
import { WIKI_POSTS } from '@/config/wiki-posts';
import { colors, size, space } from '@/theme';

// Photo height at the top of the post
const PHOTO_HEIGHT = size.touch * 4;

/** One Encyclopedia post: photo, text, sharing, comments and the other posts */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const post = WIKI_POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <AppText color={colors.inkMuted} style={[styles.notFound, { marginTop: topClearance }]}>
        Το άρθρο δεν βρέθηκε.
      </AppText>
    );
  }

  const others = WIKI_POSTS.filter((p) => p.id !== post.id);

  return (
    // The photo starts at the very top, under the corner buttons
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
      <Image source={post.image} contentFit="cover" accessibilityLabel={post.title} style={styles.photo} />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AppText size="big" bold accessibilityRole="header">
              {post.title}
            </AppText>
            <AppText size="small" color={colors.inkMuted}>
              {post.date}
            </AppText>
          </View>
          <ReadTimeBadge minutes={post.readMinutes} />
        </View>

        <PostBody blocks={post.content} />

        <Section title="Μοιραστείτε το άρθρο:">
          <ShareButtons title={post.title} />
        </Section>

        <Section title="Αφήστε σχόλιο">
          <CommentsSection />
        </Section>

        {others.length > 0 && (
          <Section title="Υπόλοιπα άρθρα">
            <PostCarousel
              posts={others}
              onOpen={(other) => router.push({ pathname: '/wiki/[id]', params: { id: other.id } })}
            />
          </Section>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: space.lg,
  },
  photo: {
    width: '100%',
    height: PHOTO_HEIGHT,
  },
  body: {
    gap: space.lg,
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  titleText: {
    flex: 1,
  },
  notFound: {
    textAlign: 'center',
  },
});
