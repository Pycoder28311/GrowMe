import { useFocusEffect } from 'expo-router';
import { createContext, use, useCallback, useMemo, type ReactNode } from 'react';
import { useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';

type BackgroundMotion = {
  /** How blurred the shell's background photos are (home): 0 = sharp, 1 = fully blurred */
  blur: SharedValue<number>;
  /** How far the page is scrolled (px), so the background's flowers drift with it (every page but home) */
  scrollY: SharedValue<number>;
};

const BackgroundMotionContext = createContext<BackgroundMotion | null>(null);

/**
 * What the shell's background follows from the page in front of it. Shared values, so a page can drive them
 * from its scroll on the UI thread (no re-renders).
 */
export function BackgroundMotionProvider({ children }: { children: ReactNode }) {
  const blur = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const motion = useMemo(() => ({ blur, scrollY }), [blur, scrollY]);
  return <BackgroundMotionContext value={motion}>{children}</BackgroundMotionContext>;
}

function useBackgroundMotion() {
  const motion = use(BackgroundMotionContext);
  if (!motion) throw new Error('Background motion hooks must be used inside BackgroundMotionProvider');
  return motion;
}

export const useBackgroundBlur = () => useBackgroundMotion().blur;

/** The scroll the background's flowers drift with: a page sets it from its scroll (and back to 0 on leaving) */
export const useBackgroundScroll = () => useBackgroundMotion().scrollY;

/**
 * A scroll handler for a page's Animated.ScrollView or Animated.FlatList that makes the background's flowers
 * drift with it. On coming back to the page (e.g. from a post) the flowers return to where its scroll left them.
 */
export function useBackgroundScrollHandler() {
  const scrollY = useBackgroundScroll();
  const own = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      scrollY.set(own.get());
    }, [scrollY, own]),
  );
  return useAnimatedScrollHandler((event) => {
    own.set(event.contentOffset.y);
    scrollY.set(event.contentOffset.y);
  });
}
