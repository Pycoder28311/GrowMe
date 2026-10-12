import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackgroundSlideshow, PlainBackground } from '@/components/layout/background-slideshow';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PageHeaderProvider, PageHeaderSlot } from '@/components/layout/page-header';
import { TopCorners } from '@/components/search/search-bar';
import { OutlinedText } from '@/components/ui/outlined-text';
import { APP_NAME, type NavId } from '@/config/app';
import { BackgroundBlurProvider } from '@/lib/background-blur';
import { colors, size, space } from '@/theme';

type AppShellProps = {
  children: ReactNode;
  activeNavId: NavId;
  onNavigate: (id: NavId) => void;
  /** False: a «Σύνδεση» note floats above the profile tab */
  signedIn: boolean;
  /** The app's name next to the leaf button (not on the home page, which shows it big, or the plant page, which fills that space) */
  showTitle?: boolean;
  /** Pages with their own button in that corner (the posts' send button, the results' filters button) don't show that note */
  hideSignInNote?: boolean;
  /** 'scene' for the photo slideshow, 'plain' for a calm warm wash behind lists */
  background: 'scene' | 'plain';
};

/** Distance from the screen top where page content starts, below the floating corner buttons */
export function useTopClearance() {
  return useSafeAreaInsets().top + space.md + size.touch + space.sm;
}

/** The frame around every signed-in page: background, the leaf and search corners, and the bottom nav */
export function AppShell({ children, activeNavId, onNavigate, signedIn, hideSignInNote, showTitle, background }: AppShellProps) {
  const insets = useSafeAreaInsets();
  const cornerTop = insets.top + space.md;

  return (
    // Pages can blur the background photos (e.g. the home page while scrolling)
    <BackgroundBlurProvider>
      <PageHeaderProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          {background === 'scene' ? <BackgroundSlideshow /> : <PlainBackground />}
          {/* Pages scroll on their own, so the nav can sit at the bottom without overlapping them */}
          <View style={styles.main}>{children}</View>
          <BottomNav activeId={activeNavId} onNavigate={onNavigate} signedIn={signedIn || !!hideSignInNote} />
          {/* Between the corners: what the page puts there (e.g. the plant page's section bar) */}
          <PageHeaderSlot top={cornerTop} side={space.md + size.touch + space.sm} height={size.touch} />
          {showTitle && (
            <View pointerEvents="none" style={[styles.title, { top: cornerTop }]}>
              {/* The same outlined name as the home page's, small */}
              <OutlinedText size="big" bold color={colors.primary} outline={2} style={styles.titleText}>
                {APP_NAME}
              </OutlinedText>
            </View>
          )}
          {/* The leaf (home) and the search, over everything (the search dims the page) */}
          <TopCorners top={cornerTop} onHome={() => onNavigate('home')} />
        </View>
      </PageHeaderProvider>
    </BackgroundBlurProvider>
  );
}

const styles = StyleSheet.create({
  // Right of the leaf button, level with it
  title: {
    position: 'absolute',
    left: space.md + size.touch + space.sm,
    height: size.touch,
    justifyContent: 'center',
  },
  titleText: {
    lineHeight: 30,
  },
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  main: {
    flex: 1,
  },
});
