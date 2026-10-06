import { createContext, use, type ReactNode } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

const BackgroundBlurContext = createContext<SharedValue<number> | null>(null);

/**
 * How blurred the shell's background photos are: 0 = sharp, 1 = fully blurred.
 * A shared value, so a page can drive it from its scroll on the UI thread (no re-renders).
 */
export function BackgroundBlurProvider({ children }: { children: ReactNode }) {
  const blur = useSharedValue(0);
  return <BackgroundBlurContext value={blur}>{children}</BackgroundBlurContext>;
}

export function useBackgroundBlur() {
  const blur = use(BackgroundBlurContext);
  if (!blur) throw new Error('useBackgroundBlur must be used inside BackgroundBlurProvider');
  return blur;
}
