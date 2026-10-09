import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, space } from '@/theme';

export type PageSection = { id: string; label: string };

type SectionBarProps = {
  sections: PageSection[];
  /** The section at the middle of the screen: highlighted and kept centred */
  current: string | null;
  onPick: (id: string) => void;
  /** Over the photos: white letters with a dark shadow; else ink with a light glow */
  onPhotos: boolean;
};

/**
 * The page's sections as a row of labels between the corner buttons (no background, only a text
 * shadow). The label of the section in view is highlighted and slides to the middle; a tap scrolls
 * the page to that section.
 */
export function SectionBar({ sections, current, onPick, onPhotos }: SectionBarProps) {
  const scroll = useRef<ScrollView>(null);
  const places = useRef<Record<string, { x: number; width: number }>>({});
  const [barWidth, setBarWidth] = useState(0);

  // Keep the current label in the middle of the bar
  useEffect(() => {
    const place = current ? places.current[current] : undefined;
    if (!place || barWidth === 0) return;
    scroll.current?.scrollTo({ x: Math.max(0, place.x + place.width / 2 - barWidth / 2), animated: true });
  }, [current, barWidth]);

  const textStyle = onPhotos ? styles.onPhotos : styles.onPage;

  return (
    <View accessibilityRole="tablist" onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Room so the first and last labels can reach the middle too
        contentContainerStyle={[styles.row, { paddingHorizontal: barWidth / 3 }]}>
        {sections.map((section) => {
          const selected = section.id === current;
          return (
            <PressableScale
              key={section.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() => onPick(section.id)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                places.current[section.id] = { x, width };
              }}
              pressedScale={0.94}
              hitSlop={space.sm}
              style={styles.label}>
              <AppText
                size="small"
                bold={selected}
                color={onPhotos ? colors.surface : colors.ink}
                style={[textStyle, !selected && styles.dim]}>
                {section.label}
              </AppText>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: space.md,
  },
  label: {
    paddingVertical: space.sm,
  },
  onPhotos: {
    textShadowColor: alpha(colors.ink, 0.75),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  onPage: {
    textShadowColor: alpha(colors.surface, 0.95),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  dim: {
    opacity: 0.7,
  },
});
