import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ExploreSheet } from '@/components/explore/explore-sheet';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { AppTitle } from '@/components/ui/app-title';
import { GlassText } from '@/components/ui/glass-text';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { APP_TAGLINE } from '@/config/app';
import type { Filters } from '@/config/filters';
import { useExploreFilters } from '@/lib/explore-filters';
import { colors, iconSize, shade, space } from '@/theme';

// The tagline wraps to about two short lines under the title
const TAGLINE_WIDTH = 256;

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

  const handleExploreClose = (applied: Filters | null) => {
    setIsExploreOpen(false);
    if (!applied) return;
    setFilters(applied);
    router.navigate('/results');
  };

  return (
    <View style={styles.page}>
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

      {/* Small link centred just above the bottom bar; the white glow keeps it readable over the photos */}
      <PressableScale accessibilityRole="button" style={styles.learnMore}>
        <AppText bold color={colors.primary} style={styles.glow}>
          Μάθε περισσότερα
        </AppText>
        <Icon name="chevronRight" size={iconSize.small} color={colors.primary} bold />
      </PressableScale>

      {isExploreOpen && <ExploreSheet initialFilters={filters} onClose={handleExploreClose} />}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
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
