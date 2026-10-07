import { DefaultTheme, router, Stack, ThemeProvider, usePathname } from 'expo-router';

import { AppShell } from '@/components/layout/app-shell';
import type { NavId } from '@/config/app';
import { BlogPreviewProvider } from '@/lib/blog-preview';
import { ExploreFiltersProvider } from '@/lib/explore-filters';

// The pages paint no background of their own, so the shell's photos and washes show through
// (the navigation theme's background would cover them: black in dark mode). The design is light only.
const SHELL_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

// The page each bottom tab opens
const TAB_ROUTES = {
  home: '/',
  messages: '/community',
  wiki: '/wiki',
  profile: '/profile',
} as const satisfies Record<NavId, string>;

// Which bottom tab a page belongs to
const navIdFor = (pathname: string): NavId => {
  if (pathname.startsWith('/community')) return 'messages';
  if (pathname.startsWith('/wiki')) return 'wiki';
  if (pathname.startsWith('/profile') || pathname.startsWith('/notes')) return 'profile';
  return 'home';
};

/** Signed-in pages inside the shared frame (background, corner buttons, bottom nav) */
export default function AppLayout() {
  const pathname = usePathname();

  return (
    <ExploreFiltersProvider>
      <AppShell
        activeNavId={navIdFor(pathname)}
        onNavigate={(id) => router.navigate(TAB_ROUTES[id])}
        background={pathname === '/' ? 'scene' : 'plain'}>
        <ThemeProvider value={SHELL_THEME}>
          {/* Blue blog links in texts open their panel over any page */}
          <BlogPreviewProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
          </BlogPreviewProvider>
        </ThemeProvider>
      </AppShell>
    </ExploreFiltersProvider>
  );
}
