import { parseRichContent, plainTextOf } from '@growme/shared';
import { useId, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { PaperGrain } from '@/components/ui/flower-shapes';
import { Icon, type IconName } from '@/components/ui/icon';
import { LinkedText } from '@/components/ui/linked-text';
import { botanical, iconSize, smallCaps, space, type TileTone } from '@/theme';

/** How wide the fade over the end of a cut line is */
const FADE_WIDTH = 56;

/** The end of a cut line melting into the block's own colour */
function LineFade({ color }: { color: string }) {
  const id = `block-fade-${useId().replace(/:/g, '')}`;
  return (
    <Svg pointerEvents="none" width={FADE_WIDTH} height="100%" style={styles.fade}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="1" stopColor={color} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={FADE_WIDTH} height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * One text block in the tiles' style (e.g. «Τι βλέπω»): its warm tint with paper grain, the icon in its accent
 * circle, a small uppercase title, then the text (the editor's document or a plain text). A text longer than one
 * line shows only that line, fading out on the right, with an arrow; a tap calls `onOpen` (the panel with the
 * whole text). (An invisible full copy of the text tells how many lines it needs.)
 */
export function AccentBlock({
  title,
  text,
  icon,
  tone,
  onOpen,
}: {
  title: string;
  text: string;
  icon: IconName;
  tone: TileTone;
  onOpen: () => void;
}) {
  const preview = plainTextOf(parseRichContent(text));
  const [heights, setHeights] = useState({ line: 0, full: 0 });
  const long = heights.line > 0 && heights.full > heights.line + 2;

  const content = (
    <View style={[styles.block, { backgroundColor: tone.background }]}>
      <PaperGrain />
      <View style={[styles.circle, { backgroundColor: tone.circle }]}>
        <Icon name={icon} size={iconSize.normal} color={tone.icon} />
      </View>
      <View style={styles.words}>
        <AppText color={botanical.inkMuted} style={smallCaps}>
          {title}
        </AppText>
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
            <LinkedText style={styles.text}>{preview}</LinkedText>
          </View>
          <View
            onLayout={(event) => {
              const line = event.nativeEvent.layout.height;
              setHeights((h) => (h.line === line ? h : { ...h, line }));
            }}>
            {/* Always one line: a text that is not long fits in it anyway (and this measures one line) */}
            <LinkedText numberOfLines={1} ellipsizeMode="clip" style={styles.text}>
              {preview}
            </LinkedText>
          </View>
          {long && <LineFade color={tone.background} />}
        </View>
      </View>
      {long && <Icon name="chevronRight" size={iconSize.normal} color={botanical.inkMuted} bold />}
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
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md - 4,
    paddingHorizontal: space.md - 4,
    paddingVertical: space.md - 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    flex: 1,
    gap: 2,
  },
  textBox: {
    position: 'relative',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: botanical.ink,
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
