import { parseRichContent } from '@growme/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BotanicalBackground } from '@/components/layout/botanical-background';
import { CurvedEdge } from '@/components/ui/flower-shapes';
import { CURVE_HEIGHT } from '@/components/plants/photo-header';
import { useTopClearance } from '@/components/layout/app-shell';
import { BlogSkeleton, BLOG_PHOTO_HEIGHT } from '@/components/search/page-skeleton';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { Section } from '@/components/ui/section';
import { CommentsSection } from '@/components/wiki/comments-section';
import { PostCarousel } from '@/components/wiki/post-carousel';
import { ReadTimeBadge } from '@/components/wiki/read-time-badge';
import { RichText } from '@/components/wiki/rich-text';
import { ShareButtons } from '@/components/wiki/share-buttons';
import { useBackgroundScroll, useBackgroundScrollHandler } from '@/lib/background-motion';
import { blogPreviewOf } from '@/lib/result-preview';
import { publishedDate, readMinutes, useBlog, useBlogs } from '@/lib/blogs';
import { ARTICLE_DECORATIONS, ARTICLE_FRONT_DECORATIONS, botanical, colors, space, titleFont } from '@/theme';

// Photo height at the top of the post
const PHOTO_HEIGHT = BLOG_PHOTO_HEIGHT;

/** One Encyclopedia article from the database: photo, text, sharing, comments and the other articles */
export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topClearance = useTopClearance();
  const backgroundScroll = useBackgroundScrollHandler();
  const scrollY = useBackgroundScroll();
  const { width } = useWindowDimensions();
  const { blog: post, state, retry } = useBlog(Number(id));
  // The newest articles, for "Υπόλοιπα άρθρα"
  const { blogs } = useBlogs();

  if (state === 'loading') {
    return <BlogSkeleton blog={blogPreviewOf(Number(id))} topClearance={topClearance} />;
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
    <View style={styles.root}>
    {/* The painted clusters at the page's edges, behind the text; they drift and slide out to the sides as it scrolls */}
    <BotanicalBackground scrollY={scrollY} decorations={ARTICLE_DECORATIONS} />
    <Animated.ScrollView
      onScroll={backgroundScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.page, !cover && { paddingTop: topClearance }]}>
      {cover && (
        <View>
          <Image source={{ uri: cover.url }} contentFit="cover" accessibilityLabel={post.name} style={styles.photo} />
          {/* The same curved line as the plant page's photos have, where the photo meets the page (no fade) */}
          <CurvedEdge width={width} height={CURVE_HEIGHT} color={botanical.page} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AppText size="big" bold accessibilityRole="header" style={titleFont}>
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
    </Animated.ScrollView>
    {/* The left edge's petals over the photo */}
    <BotanicalBackground bare scrollY={scrollY} decorations={ARTICLE_FRONT_DECORATIONS} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
