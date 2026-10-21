import { parseRichContent, plainTextOf } from '@growme/shared';
import { useId, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { LinkedText } from '@/components/ui/linked-text';
import { colors, iconSize, space } from '@/theme';

/**
 * The tips' look: white blocks, square, with a thick soft orange line on the left. Warm and light,
 * like the page that fades from white to peach under them.
 */
const TIP_BACKGROUND = '#ffffff';
const TIP_LINE = '#f5b971';
/** How wide the fade over the end of a cut line is */
const FADE_WIDTH = 56;

/** The end of a cut line melting into the tip's white */
function LineFade() {
  const id = `tip-fade-${useId().replace(/:/g, '')}`;
  return (
    <Svg pointerEvents="none" width={FADE_WIDTH} height="100%" style={styles.fade}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={TIP_BACKGROUND} stopOpacity={0} />
          <Stop offset="1" stopColor={TIP_BACKGROUND} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={FADE_WIDTH} height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * One block of the page's tips look (white, square, a soft orange line on the left): a title, then its text
 * (the editor's document or a plain text). A text longer than one line shows only that line, fading out on
 * the right, with an arrow; a tap calls `onOpen` (the panel with the whole text). (An invisible full copy
 * of the text tells how many lines it needs.)
 */
export function AccentBlock({ title, text, onOpen }: { title: string; text: string; onOpen: () => void }) {
  const preview = plainTextOf(parseRichContent(text));
  const [heights, setHeights] = useState({ line: 0, full: 0 });
  const long = heights.line > 0 && heights.full > heights.line + 2;

  const content = (
    <View style={styles.tip}>
      <AppText bold>{title}</AppText>
      <View style={styles.textRow}>
        <View style={styles.textBox}>
          {/* The whole text, unseen: only measured */}
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.measure}
            onLayout={(event) => {
              const full = event.nativeEvent.layout.height;
              setHeights((h) => (h.full === full ? h : { ...h, full }));
            }}>
            <LinkedText>{preview}</LinkedText>
          </View>
          <View
            onLayout={(event) => {
              const line = event.nativeEvent.layout.height;
              setHeights((h) => (h.line === line ? h : { ...h, line }));
            }}>
            {/* Always one line: a tip that is not long fits in it anyway (and this measures one line) */}
            <LinkedText numberOfLines={1} ellipsizeMode="clip">
              {preview}
            </LinkedText>
          </View>
          {long && <LineFade />}
        </View>
        {long && <Icon name="chevronRight" size={iconSize.normal} color={colors.inkMuted} bold />}
      </View>
    </View>
  );

  if (!long) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: όλο το κείμενο`}
      onPress={onOpen}
      style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tip: {
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: TIP_BACKGROUND,
    borderLeftWidth: 4,
    borderLeftColor: TIP_LINE,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  textBox: {
    flex: 1,
  },
  // Laid out at the text's width, never seen
  measure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
  fade: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
