import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import type { NoteImage } from '@/api/notes';
import { Spacing } from '@/constants/theme';

const HEIGHT = 220;

/** Swipeable, full-width image carousel with page dots */
export function ImageCarousel({ images }: { images: NoteImage[] }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          data={images}
          keyExtractor={(image) => String(image.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.url }}
              style={{ width, height: HEIGHT }}
              contentFit="cover"
              transition={150}
            />
          )}
          style={styles.carousel}
        />
      )}
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((image, i) => (
            <View key={image.id} style={[styles.dot, i === index && styles.activeDot]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: {
    borderRadius: Spacing.two,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8b8d98',
    opacity: 0.4,
  },
  activeDot: {
    opacity: 1,
  },
});
