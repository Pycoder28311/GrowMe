import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackgroundSlideshow, PlainBackground } from '@/components/layout/background-slideshow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { IconButton } from '@/components/ui/icon-button';
import type { NavId } from '@/config/app';
import { BackgroundBlurProvider } from '@/lib/background-blur';
import { colors, size, space } from '@/theme';

type AppShellProps = {
  children: ReactNode;
  activeNavId: NavId;
  onNavigate: (id: NavId) => void;
  /** 'scene' for the photo slideshow, 'plain' for a calm warm wash behind lists */
  background: 'scene' | 'plain';
};

/** Distance from the screen top where page content starts, below the floating corner buttons */
export function useTopClearance() {
  return useSafeAreaInsets().top + space.md + size.touch + space.sm;
}

/** The frame around every signed-in page: background, corner buttons and the bottom nav */
export function AppShell({ children, activeNavId, onNavigate, background }: AppShellProps) {
  const insets = useSafeAreaInsets();
  const cornerTop = insets.top + space.md;

  return (
    // Pages can blur the background photos (e.g. the home page while scrolling)
    <BackgroundBlurProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        {background === 'scene' ? <BackgroundSlideshow /> : <PlainBackground />}
        {/* Pages scroll on their own, so the nav can sit at the bottom without overlapping them */}
        <View style={styles.main}>{children}</View>
        <IconButton
          icon="home"
          label="Αρχική"
          onPress={() => onNavigate('home')}
          style={[styles.corner, { top: cornerTop, left: space.md }]}
        />
        <IconButton icon="search" label="Αναζήτηση" style={[styles.corner, { top: cornerTop, right: space.md }]} />
        <BottomNav activeId={activeNavId} onNavigate={onNavigate} />
      </View>
    </BackgroundBlurProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  main: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    zIndex: 10,
  },
});
