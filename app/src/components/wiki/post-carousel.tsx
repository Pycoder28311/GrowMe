import type { Blog } from '@growme/shared';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { ArrowButton } from '@/components/ui/arrow-button';
import { PostCard } from '@/components/wiki/post-card';
import { size, space } from '@/theme';

type PostCarouselProps = {
  posts: Blog[];
  onOpen: (post: Blog) => void;
};

/** Post cards side by side, one at a time with the next one peeking in; arrows step through them */
export function PostCarousel({ posts, onOpen }: PostCarouselProps) {
  const screenWidth = useWindowDimensions().width;
  const listRef = useRef<FlatList<Blog>>(null);
  const [index, setIndex] = useState(0);
  // Leaves a strip of the next card visible on the right
  const cardWidth = screenWidth - space.md * 2 - space.lg;
  const step = cardWidth + space.sm;

  const show = (next: number) => {
    const target = Math.min(posts.length - 1, Math.max(0, next));
    listRef.current?.scrollToOffset({ offset: target * step, animated: true });
    setIndex(target);
  };

  return (
    // Bleeds to the screen edges so the cards scroll in from the side
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(post) => String(post.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / step))}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <PostCard post={item} onPress={() => onOpen(item)} style={{ width: cardWidth }} />}
      />
      {posts.length > 1 && (
        <>
          <ArrowButton
            direction="previous"
            label="Προηγούμενο άρθρο"
            disabled={index === 0}
            onPress={() => show(index - 1)}
            style={[styles.arrow, { left: space.xs }]}
          />
          <ArrowButton
            direction="next"
            label="Επόμενο άρθρο"
            disabled={index === posts.length - 1}
            onPress={() => show(index + 1)}
            style={[styles.arrow, { right: space.xs }]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: -space.md,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: space.md,
    // Room for the cards' shadows
    paddingVertical: space.xs,
  },
  gap: {
    width: space.sm,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -size.touch / 2,
  },
});
