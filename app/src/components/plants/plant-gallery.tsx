import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, iconSize, radius, shadow, size, space } from '@/theme';

// Photo height: a little over a third of a phone screen
const PHOTO_HEIGHT = 280;

type PlantGalleryProps = {
  photos: ImageSourcePropType[];
  /** Read by screen readers, e.g. the plant's name */
  label: string;
};

/** Full-width swipeable photos with arrows, and tappable thumbnails below that jump to a photo */
export function PlantGallery({ photos, label }: PlantGalleryProps) {
  const width = useWindowDimensions().width;
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const show = (next: number) => {
    const target = Math.min(photos.length - 1, Math.max(0, next));
    scrollRef.current?.scrollTo({ x: target * width, animated: true });
    setIndex(target);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}>
        {photos.map((photo, i) => (
          <Image
            key={i}
            source={photo}
            contentFit="cover"
            accessibilityLabel={`${label}, φωτογραφία ${i + 1} από ${photos.length}`}
            style={{ width, height: PHOTO_HEIGHT }}
          />
        ))}
      </ScrollView>

      {photos.length > 1 && (
        <>
          <Arrow icon="chevronLeft" label="Προηγούμενη φωτογραφία" disabled={index === 0} onPress={() => show(index - 1)} side="left" />
          <Arrow
            icon="chevronRight"
            label="Επόμενη φωτογραφία"
            disabled={index === photos.length - 1}
            onPress={() => show(index + 1)}
            side="right"
          />

          {/* Thumbnails overlap the photo's bottom edge; the shown one is outlined */}
          <View style={styles.thumbs}>
            {photos.map((photo, i) => (
              <PressableScale
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Φωτογραφία ${i + 1}`}
                accessibilityState={{ selected: i === index }}
                onPress={() => show(i)}
                style={[styles.thumb, i === index && styles.thumbActive]}>
                <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} />
              </PressableScale>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

type ArrowProps = {
  icon: 'chevronLeft' | 'chevronRight';
  label: string;
  side: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
};

function Arrow({ icon, label, side, disabled, onPress }: ArrowProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.arrow, { [side]: space.md }, disabled && styles.arrowDisabled]}>
      <Icon name={icon} size={iconSize.big} color={colors.ink} bold />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    top: PHOTO_HEIGHT / 2 - size.touch / 2,
    width: size.touch,
    height: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: alpha(colors.surface, 0.85),
    boxShadow: shadow.raised,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  thumbs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: -size.touch / 2,
  },
  thumb: {
    width: size.touch,
    height: size.touch,
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  thumbActive: {
    borderColor: colors.primary,
  },
});
