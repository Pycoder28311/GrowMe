import { DefaultTheme, router, Stack, ThemeProvider, usePathname } from 'expo-router';

import { AppShell } from '@/components/layout/app-shell';
import type { NavId } from '@/config/app';
import { BlogPreviewProvider } from '@/lib/blog-preview';
import { ExploreFiltersProvider, useExploreFilters } from '@/lib/explore-filters';
import { FlightProvider } from '@/lib/flight';
import { activeFilters } from '@/lib/plant-filter-match';

// The pages paint no background of their own, so the shell's photos and washes show through
// (the navigation theme's background would cover them: black in dark mode). The design is light only.
const SHELL_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

// The page each bottom tab opens
const TAB_ROUTES = {
  home: '/',
  messages: '/community',
  results: '/results',
  wiki: '/wiki',
  profile: '/profile',
} as const satisfies Record<NavId, string>;

// Which bottom tab a page belongs to
const navIdFor = (pathname: string): NavId => {
  if (pathname.startsWith('/community')) return 'messages';
  if (pathname.startsWith('/wiki')) return 'wiki';
  if (pathname.startsWith('/results')) return 'results';
  if (pathname.startsWith('/profile') || pathname.startsWith('/notes')) return 'profile';
  return 'home';
};

/** Signed-in pages inside the shared frame (background, corner buttons, bottom nav) */
export default function AppLayout() {
  return (
    <ExploreFiltersProvider>
      <Shell />
    </ExploreFiltersProvider>
  );
}

function Shell() {
  const pathname = usePathname();
  const { filters, openExplore } = useExploreFilters();

  // The results tab shows the plants for the chosen filters; with none chosen yet it asks for them first
  const navigate = (id: NavId) => {
    if (id === 'results' && activeFilters(filters).length === 0) openExplore();
    else router.navigate(TAB_ROUTES[id]);
  };

  return (
    <>
      {/* Around the shell, so a tapped result or stage can grow over the whole screen */}
      <FlightProvider>
        <AppShell
          activeNavId={navIdFor(pathname)}
          onNavigate={navigate}
          background={pathname === '/' ? 'scene' : 'plain'}>
          <ThemeProvider value={SHELL_THEME}>
            {/* Blue blog links in texts open their panel over any page */}
            <BlogPreviewProvider>
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
            </BlogPreviewProvider>
          </ThemeProvider>
        </AppShell>
      </FlightProvider>
    </>
  );
}
