import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreSheet } from '@/components/explore/explore-sheet';
import { AskCard } from '@/components/home/ask-card';
import { FollowUs } from '@/components/home/follow-us';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppTitle } from '@/components/ui/app-title';
import { GlassText } from '@/components/ui/glass-text';
import { Icon } from '@/components/ui/icon';
import { APP_TAGLINE } from '@/config/app';
import { useBackgroundBlur } from '@/lib/background-motion';
import { useExploreFilters } from '@/lib/explore-filters';
import { colors, iconSize, shade, size, space } from '@/theme';

// The tagline wraps to about three short lines under the title
const TAGLINE_WIDTH = 340;

// Scroll effects (as on the TakeTheTrip home page): the background picks up its full blur over the
// first 400px, and the hero drifts up, shrinks and fades over 70% of a screen height
const BLUR_DISTANCE = 400;
const HERO_DISTANCE = 0.7;

// The title slides from the middle of the first screen to its place next to the leaf button (where every
// other page shows it), over this share of a screen height of scrolling, shrinking to the same size
const TITLE_DISTANCE = 0.32;
const TITLE_FONT = 56;
const NAV_TITLE_FONT = 24;

// Two quick hops to the right, then a rest (1.8s cycle): a hint to tap. Waits for the title to pop in.
function NudgingChevron() {
  const x = useSharedValue(0);

  useEffect(() => {
    const hop = { duration: 150, easing: Easing.inOut(Easing.ease) };
    const twoHopsThenRest = withSequence(
      withTiming(3, hop),
      withTiming(0, hop),
      withTiming(3, hop),
      withTiming(0, hop),
      withTiming(0, { duration: 1200 }),
    );
    x.set(withDelay(1000, withRepeat(twoHopsThenRest, -1)));
  }, [x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View style={[styles.chevron, style]}>
      <Icon name="chevronRight" size={iconSize.normal} color={colors.white} bold />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { selection, setSelection } = useExploreFilters();
  // The quick filters sheet opens from «Επίλεξε φυτό»; the results page opens when it closes
  const [exploring, setExploring] = useState(false);
  const blur = useBackgroundBlur();
  // Reduced-motion users keep a sharp background
  const reduceMotion = useReducedMotion();
  const scrollY = useSharedValue(0);
  // Height of the visible page: the hero fills exactly the first screen
  const [viewport, setViewport] = useState(0);
  const insets = useSafeAreaInsets();
  // The title is drawn in a layer over the page (not in the scrolling content), so it never has to chase
  // the scroll: the hero keeps an invisible copy for its place, measured (relative to the page) at the top
  const pageRef = useRef<View>(null);
  const titleRef = useRef<View>(null);
  const titleStart = useSharedValue({ left: 0, top: 0, width: 0, height: 0 });
  const pageTop = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    const y = event.contentOffset.y;
    scrollY.set(y);
    blur.set(reduceMotion ? 0 : Math.min(1, Math.max(0, y / BLUR_DISTANCE)));
  });

  // Leaving the page leaves the background sharp again
  useEffect(() => () => blur.set(0), [blur]);

  // "Up and behind": the title block drifts up faster than the page, shrinks and fades
  const heroStyle = useAnimatedStyle(() => {
    if (viewport === 0) return {};
    const p = Math.min(1, Math.max(0, scrollY.value / (viewport * HERO_DISTANCE)));
    return { opacity: 1 - p * 0.6, transform: [{ translateY: p * -70 }, { scale: 1 - p * 0.18 }] };
  });

  useEffect(() => {
    if (viewport === 0) return;
    pageRef.current?.measureInWindow((pageX, pageY) => {
      pageTop.set(pageY);
      titleRef.current?.measureInWindow((x, y, width, height) =>
        titleStart.set({ left: x - pageX, top: y - pageY, width, height }),
      );
    });
  }, [viewport, titleStart, pageTop]);

  // Scrolling slides the title from its place in the hero to the right of the leaf button; scrolling back
  // slides it home. Its place depends only on how far along it is, so once there it stays perfectly still.
  const titleStyle = useAnimatedStyle(() => {
    const start = titleStart.get();
    if (viewport === 0 || start.width === 0) return { opacity: 0 };
    const t = Math.min(1, Math.max(0, scrollY.get() / (viewport * TITLE_DISTANCE)));
    const e = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep: starts and settles very gently
    const shrink = NAV_TITLE_FONT / TITLE_FONT;
    const startX = start.left + start.width / 2;
    const startY = start.top + start.height / 2;
    const endX = space.md + size.touch + space.sm + (start.width * shrink) / 2;
    const endY = insets.top + space.md + size.touch / 2 - pageTop.get();
    return {
      opacity: 1,
      transform: [
        { translateX: start.left + (endX - startX) * e },
        { translateY: start.top + (endY - startY) * e },
        { scale: 1 - (1 - shrink) * e },
      ],
    };
  });

  return (
    <View ref={pageRef} collapsable={false} style={styles.page}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        onLayout={(event) => setViewport(event.nativeEvent.layout.height)}>
        <View style={[styles.hero, { minHeight: viewport }]}>
          <View style={styles.heroContent}>
            {/* The title's place (the visible one is the layer below the scroll view) */}
            <View
              ref={titleRef}
              collapsable={false}
              style={styles.titlePlace}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <AppTitle />
            </View>
            <Animated.View style={[styles.heroRest, heroStyle]}>
            {/* Bold phrase that pops in as the title's last letters land */}
            <GlassText text={APP_TAGLINE} delayMs={850} maxWidth={TAGLINE_WIDTH} />
            <ActionButton innerGlow onPress={() => setExploring(true)}>
              {/* The word stays centred in the button; the arrow hangs off its right side */}
              <View>
                <ActionButtonText shadow>Επίλεξε φυτό</ActionButtonText>
                <NudgingChevron />
              </View>
            </ActionButton>
            </Animated.View>
          </View>
        </View>

        {/* Below the first screen: reached by scrolling, over the blurred background */}
        <View style={styles.more}>
          <AskCard />
          <FollowUs />
        </View>
      </Animated.ScrollView>

      {/* Slides up and left to sit next to the leaf button as the page scrolls */}
      <Animated.View pointerEvents="none" style={[styles.title, titleStyle]}>
        <AppTitle />
      </Animated.View>

      {exploring && (
        <ExploreSheet
          initialSelection={selection}
          onClose={(applied) => {
            if (applied) setSelection(applied);
            setExploring(false);
            router.navigate('/results');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  titlePlace: {
    opacity: 0,
  },
  title: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  hero: {
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  // The gaps look equal (title to phrase, phrase to button): the title's tall line box and its outline
  // make the first look bigger than the gap's number, so it is smaller by what the second is bigger
  heroContent: {
    alignItems: 'center',
    gap: space.md - 6,
  },
  // The tagline and the button: they drift up and fade as before
  heroRest: {
    alignItems: 'center',
    gap: space.md + 6,
  },
  more: {
    gap: space.lg * 2,
    paddingHorizontal: space.md,
    paddingTop: space.lg,
    paddingBottom: space.lg * 2,
  },
  chevron: {
    position: 'absolute',
    left: '100%',
    top: '50%',
    marginTop: -iconSize.normal / 2,
    marginLeft: space.md,
    filter: [{ dropShadow: { offsetX: 0, offsetY: 2, standardDeviation: 0, color: shade } }],
  },
});
