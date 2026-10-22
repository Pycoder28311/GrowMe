import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackgroundSlideshow } from '@/components/layout/background-slideshow';
import { BotanicalBackground } from '@/components/layout/botanical-background';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PageHeaderProvider, PageHeaderSlot } from '@/components/layout/page-header';
import { TopCorners } from '@/components/search/search-bar';
import { OutlinedText } from '@/components/ui/outlined-text';
import { APP_NAME, type NavId } from '@/config/app';
import { BackgroundMotionProvider, useBackgroundScroll } from '@/lib/background-motion';
import { botanical, colors, PAGE_DECORATIONS, size, space } from '@/theme';

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
  /** 'scene' for the photo slideshow (home), 'plain' for the botanical paper and its drifting flowers */
  background: 'scene' | 'plain';
};

/** Distance from the screen top where page content starts, below the floating corner buttons */
export function useTopClearance() {
  return useSafeAreaInsets().top + space.md + size.touch + space.sm;
}

/** The botanical background, its flowers drifting with the page's scroll (useBackgroundScroll) */
function ShellBackground() {
  return <BotanicalBackground scrollY={useBackgroundScroll()} decorations={PAGE_DECORATIONS} />;
}

/** The frame around every signed-in page: background, the leaf and search corners, and the bottom nav */
export function AppShell({ children, activeNavId, onNavigate, signedIn, hideSignInNote, showTitle, background }: AppShellProps) {
  const insets = useSafeAreaInsets();
  const cornerTop = insets.top + space.md;

  return (
    // Pages can blur the background photos (e.g. the home page while scrolling)
    <BackgroundMotionProvider>
      <PageHeaderProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          {background === 'scene' ? <BackgroundSlideshow /> : <ShellBackground />}
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
    </BackgroundMotionProvider>
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
    backgroundColor: botanical.page,
  },
  main: {
    flex: 1,
  },
});
