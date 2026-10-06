import { parseRichContent } from '@growme/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { Section } from '@/components/ui/section';
import { CommentsSection } from '@/components/wiki/comments-section';
import { PostCarousel } from '@/components/wiki/post-carousel';
import { ReadTimeBadge } from '@/components/wiki/read-time-badge';
import { RichText } from '@/components/wiki/rich-text';
import { ShareButtons } from '@/components/wiki/share-buttons';
import { publishedDate, readMinutes, useBlog, useBlogs } from '@/lib/blogs';
import { colors, size, space } from '@/theme';

// Photo height at the top of the post
const PHOTO_HEIGHT = size.touch * 4;

/** One Encyclopedia article from the database: photo, text, sharing, comments and the other articles */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const { blog: post, state, retry } = useBlog(Number(id));
  // The newest articles, for "Υπόλοιπα άρθρα"
  const { blogs } = useBlogs();

  if (state === 'loading') {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: topClearance }} />;
  }
  if (state === 'error' || !post) {
    return (
      <View style={[styles.notFound, { marginTop: topClearance }]}>
        <AppText color={colors.inkMuted} style={styles.center}>
          Το άρθρο δεν βρέθηκε ή δεν ήταν δυνατή η φόρτωσή του.
        </AppText>
        <PillButton label="Δοκίμασε ξανά" onPress={retry} />
      </View>
    );
  }

  const others = blogs.filter((p) => p.id !== post.id);
  const cover = post.images[0];

  return (
    // The photo starts at the very top, under the corner buttons; without one the title clears them
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.page, !cover && { paddingTop: topClearance }]}>
      {cover && (
        <Image source={{ uri: cover.url }} contentFit="cover" accessibilityLabel={post.name} style={styles.photo} />
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AppText size="big" bold accessibilityRole="header">
              {post.name}
            </AppText>
            <AppText size="small" color={colors.inkMuted}>
              {publishedDate(post)}
            </AppText>
          </View>
          <ReadTimeBadge minutes={readMinutes(post)} />
        </View>

        <RichText doc={parseRichContent(post.content)} images={post.contentImages} />

        <Section title="Μοιραστείτε το άρθρο:">
          <ShareButtons title={post.name} />
        </Section>

        <Section title="Αφήστε σχόλιο">
          <CommentsSection blogId={post.id} commentCount={post.commentCount} />
        </Section>

        {others.length > 0 && (
          <Section title="Υπόλοιπα άρθρα">
            <PostCarousel
              posts={others}
              onOpen={(other) => router.push({ pathname: '/wiki/[id]', params: { id: String(other.id) } })}
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
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  center: {
    textAlign: 'center',
  },
});
