import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { ExploreSheet } from '@/components/explore/explore-sheet';
import { AskCard } from '@/components/home/ask-card';
import { FollowUs } from '@/components/home/follow-us';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { AppTitle } from '@/components/ui/app-title';
import { GlassText } from '@/components/ui/glass-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { APP_TAGLINE } from '@/config/app';
import type { Filters } from '@/config/filters';
import { useBackgroundBlur } from '@/lib/background-blur';
import { useExploreFilters } from '@/lib/explore-filters';
import { colors, iconSize, shade, space } from '@/theme';

// The tagline wraps to about two short lines under the title
const TAGLINE_WIDTH = 256;

// Scroll effects (as on the TakeTheTrip home page): the background picks up its full blur over the
// first 400px, and the hero drifts up, shrinks and fades over 70% of a screen height
const BLUR_DISTANCE = 400;
const HERO_DISTANCE = 0.7;

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
      <Icon name="chevronRight" size={iconSize.normal} color={colors.surface} bold />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { filters, setFilters } = useExploreFilters();
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const blur = useBackgroundBlur();
  // Reduced-motion users keep a sharp background
  const reduceMotion = useReducedMotion();
  const scrollY = useSharedValue(0);
  // Height of the visible page: the hero fills exactly the first screen
  const [viewport, setViewport] = useState(0);

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

  const handleExploreClose = (applied: Filters | null) => {
    setIsExploreOpen(false);
    if (!applied) return;
    setFilters(applied);
    router.navigate('/results');
  };

  return (
    <>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        onLayout={(event) => setViewport(event.nativeEvent.layout.height)}>
        <View style={[styles.hero, { minHeight: viewport }]}>
          <Animated.View style={[styles.heroContent, heroStyle]}>
            <AppTitle />
            {/* Bold phrase that pops in as the title's last letters land */}
            <GlassText text={APP_TAGLINE} delayMs={450} maxWidth={TAGLINE_WIDTH} />
            <ActionButton onPress={() => setIsExploreOpen(true)}>
              {/* The word stays centred in the button; the arrow hangs off its right side */}
              <View>
                <ActionButtonText shadow>Επίλεξε φυτό</ActionButtonText>
                <NudgingChevron />
              </View>
            </ActionButton>
          </Animated.View>

          {/* Small link centred at the bottom of the first screen; the white glow keeps it readable */}
          <PressableScale accessibilityRole="button" style={styles.learnMore}>
            <AppText bold color={colors.primary} style={styles.glow}>
              Μάθε περισσότερα
            </AppText>
            <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
          </PressableScale>
        </View>

        {/* Below the first screen: reached by scrolling, over the blurred background */}
        <View style={styles.more}>
          <AskCard />
          <FollowUs />
        </View>
      </Animated.ScrollView>

      {isExploreOpen && <ExploreSheet initialFilters={filters} onClose={handleExploreClose} />}
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  heroContent: {
    alignItems: 'center',
    gap: space.md,
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
  learnMore: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  glow: {
    textShadowColor: colors.surface,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
