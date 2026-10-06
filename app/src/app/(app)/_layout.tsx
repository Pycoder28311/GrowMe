import { DefaultTheme, router, Stack, ThemeProvider, usePathname } from 'expo-router';

import { AppShell } from '@/components/layout/app-shell';
import type { NavId } from '@/config/app';
import { CommunityProvider } from '@/lib/community';
import { ExploreFiltersProvider } from '@/lib/explore-filters';

// The pages paint no background of their own, so the shell's photos and washes show through
// (the navigation theme's background would cover them: black in dark mode). The design is light only.
const SHELL_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

// The page each bottom tab opens
const TAB_ROUTES = {
  home: '/',
  messages: '/community',
  wiki: '/wiki',
  settings: '/settings',
} as const satisfies Record<NavId, string>;

// Which bottom tab a page belongs to
const navIdFor = (pathname: string): NavId => {
  if (pathname.startsWith('/community')) return 'messages';
  if (pathname.startsWith('/wiki')) return 'wiki';
  if (pathname.startsWith('/settings') || pathname.startsWith('/notes')) return 'settings';
  return 'home';
};

/** Signed-in pages inside the shared frame (background, corner buttons, bottom nav) */
export default function AppLayout() {
  const pathname = usePathname();

  return (
    <ExploreFiltersProvider>
      <CommunityProvider>
        <AppShell
          activeNavId={navIdFor(pathname)}
          onNavigate={(id) => router.navigate(TAB_ROUTES[id])}
          background={pathname === '/' ? 'scene' : 'plain'}>
          <ThemeProvider value={SHELL_THEME}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
          </ThemeProvider>
        </AppShell>
      </CommunityProvider>
    </ExploreFiltersProvider>
  );
}
