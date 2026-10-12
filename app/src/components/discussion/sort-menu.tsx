import type { PostSort } from '@growme/shared';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { alpha, colors, iconSize, radius, shadow, size, space } from '@/theme';

/** What each order is called */
export const SORT_LABELS: Record<PostSort, string> = {
  newest: 'Νεότερα',
  oldest: 'Παλαιότερα',
  liked: 'Περισσότερα likes',
};
const OPTIONS: PostSort[] = ['newest', 'oldest', 'liked'];

type Anchor = { right: number; top: number };

/**
 * The posts' order: a button showing the current one («Νεότερα ▾») that opens a small list right
 * below it (over everything, closed by a tap anywhere else). Choosing one closes it.
 */
export function SortMenu({ value, onChange }: { value: PostSort; onChange: (sort: PostSort) => void }) {
  const button = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  // Opens under the button, its right edges level with the button's
  const open = () =>
    button.current?.measureInWindow((x, y, width, height) => {
      // The window's width is read from the Modal's own layout: right is measured from the screen's right edge
      setAnchor({ right: -(x + width), top: y + height + space.xs });
    });

  return (
    <>
      <View ref={button} collapsable={false}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Ταξινόμηση: ${SORT_LABELS[value]}`}
          accessibilityState={{ expanded: anchor !== null }}
          onPress={open}
          pressedScale={0.96}
          style={styles.button}>
          <AppText bold>{SORT_LABELS[value]}</AppText>
          <Icon name="chevronDown" size={iconSize.small} color={colors.ink} bold />
        </PressableScale>
      </View>

      {anchor && (
        <Modal transparent visible animationType="none" onRequestClose={() => setAnchor(null)}>
          <Pressable accessibilityLabel="Κλείσιμο" style={StyleSheet.absoluteFill} onPress={() => setAnchor(null)} />
          <MenuList anchor={anchor} value={value} onPick={(sort) => { setAnchor(null); onChange(sort); }} />
        </Modal>
      )}
    </>
  );
}

function MenuList({ anchor, value, onPick }: { anchor: Anchor; value: PostSort; onPick: (sort: PostSort) => void }) {
  // `right` was measured as minus the button's right edge from the left; turn it into a distance from the right
  const [windowWidth, setWindowWidth] = useState(0);
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={(event) => setWindowWidth(event.nativeEvent.layout.width)}>
      {windowWidth > 0 && (
        <Animated.View
          entering={FadeIn.duration(120)}
          accessibilityRole="menu"
          style={[styles.menu, { top: anchor.top, right: windowWidth + anchor.right }]}>
          {OPTIONS.map((sort) => (
            <PressableScale
              key={sort}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: sort === value }}
              onPress={() => onPick(sort)}
              pressedScale={0.98}
              style={styles.option}>
              <AppText bold={sort === value} color={sort === value ? colors.primary : colors.ink}>
                {SORT_LABELS[sort]}
              </AppText>
              {sort === value && <Icon name="check" size={iconSize.small} color={colors.primary} bold />}
            </PressableScale>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: size.touch * 0.75,
    paddingHorizontal: space.md,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: colors.surface,
  },
  menu: {
    position: 'absolute',
    minWidth: 190,
    paddingVertical: space.xs,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: alpha(colors.ink, 0.12),
    backgroundColor: colors.surface,
    boxShadow: shadow.raised,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    minHeight: size.touch,
    paddingHorizontal: space.md,
  },
});
