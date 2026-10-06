import { useCallback, useEffect, useImperativeHandle, useState, type ReactNode, type Ref } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AppText } from '@/components/ui/app-text';
import { backdrop, colors, radius, shadow, space } from '@/theme';

// Sheet height as a share of the screen, and the half-open position (share of the sheet hidden)
const SHEET_HEIGHT = 0.9;
const HALF_OPEN = 0.45;
// How far ahead a flick is projected (seconds of its speed) when picking where the sheet settles
const FLICK_PROJECTION = 0.2;
// Resistance when dragging above full height
const RUBBER_BAND = 0.25;
const HANDLE = { width: 40, height: 6 };

const SETTLE = { duration: 400, easing: Easing.bezier(0.32, 0.72, 0, 1) };

export type BottomSheetHandle = { close: () => void };

type BottomSheetProps = {
  title: string;
  /** Small action at the right of the title (e.g. Skip) */
  headerAction?: ReactNode;
  /** Pinned to the bottom of the screen while the sheet is open (e.g. the apply button) */
  footer?: ReactNode;
  /** Drawn above everything, positioned by the caller (e.g. a button kept in its on-screen place) */
  floating?: ReactNode;
  /** Extra space under the content so it can scroll clear of `floating` */
  contentBottomInset?: number;
  children: ReactNode;
  initialSnap?: 'half' | 'full';
  /** Called once the sheet has slid away */
  onClose: () => void;
  ref?: Ref<BottomSheetHandle>;
};

/**
 * Mount it to open: it slides up, can be dragged by its header to full or half height, and
 * animates out before calling onClose. `ref.current.close()` closes it from outside.
 */
export function BottomSheet({
  title,
  headerAction,
  footer,
  floating,
  contentBottomInset = 0,
  children,
  initialSnap = 'half',
  onClose,
  ref,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const height = useWindowDimensions().height * SHEET_HEIGHT;
  const halfOffset = height * HALF_OPEN;
  // Distance (px) the sheet is pushed down from fully open: 0 = full, height = off-screen
  const offset = useSharedValue(height);
  const dragStart = useSharedValue(0);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    offset.set(withTiming(initialSnap === 'full' ? 0 : halfOffset, SETTLE));
    // Only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    const slideOut = withTiming(height, SETTLE, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(onClose);
    });
    offset.set(slideOut);
  }, [offset, height, onClose]);

  useImperativeHandle(ref, () => ({ close }), [close]);

  // Drag by the header; small movements stay taps so its buttons (e.g. Skip) still work
  const drag = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onStart(() => {
      dragStart.set(offset.value);
    })
    .onUpdate((event) => {
      const next = dragStart.value + event.translationY;
      offset.set(next < 0 ? next * RUBBER_BAND : next);
    })
    .onEnd((event) => {
      const projected = offset.value + event.velocityY * FLICK_PROJECTION;
      const target = [0, halfOffset, height].reduce((best, point) =>
        Math.abs(point - projected) < Math.abs(best - projected) ? point : best,
      );
      const settle = withTiming(target, SETTLE, (finished) => {
        'worklet';
        if (finished && target === height) scheduleOnRN(onClose);
      });
      offset.set(settle);
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, 1 - offset.value / height)),
  }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  // The footer stays pinned to the screen bottom between full and half open, and only follows the
  // sheet once it is dragged further down towards closing (or while it opens and closes)
  const footerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(0, offset.value - halfOffset) }],
  }));

  const bottomPadding = Math.max(space.lg, insets.bottom);

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable accessibilityLabel="Κλείσιμο" style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <Animated.View accessibilityViewIsModal style={[styles.sheet, { height }, sheetStyle]}>
          <GestureDetector gesture={drag}>
            <View style={styles.header}>
              <View style={styles.handle} />
              {/* Equal side columns keep the title centred while giving the action its own space */}
              <View style={styles.titleRow}>
                <View style={styles.side} />
                <AppText size="big" color={colors.primary} accessibilityRole="header">
                  {title}
                </AppText>
                <View style={[styles.side, styles.action]}>{headerAction}</View>
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            style={styles.content}
            // Leave room so the last content can scroll clear of the pinned footer
            contentContainerStyle={{ paddingBottom: (footer ? footerHeight + space.md : bottomPadding) + contentBottomInset }}>
            {children}
          </ScrollView>
        </Animated.View>

        {footer && (
          <Animated.View
            onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
            style={[styles.footer, { paddingBottom: bottomPadding }, footerStyle]}>
            {footer}
          </Animated.View>
        )}

        {floating}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: backdrop,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    backgroundColor: colors.surface,
    boxShadow: shadow.sheet,
  },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  handle: {
    alignSelf: 'center',
    width: HANDLE.width,
    height: HANDLE.height,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  titleRow: {
    marginTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  side: {
    flex: 1,
  },
  action: {
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: space.lg,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
});
