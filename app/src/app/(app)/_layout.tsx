import { DefaultTheme, router, Stack, ThemeProvider, usePathname } from 'expo-router';

import { AppShell } from '@/components/layout/app-shell';
import type { NavId } from '@/config/app';
import { BlogPreviewProvider } from '@/lib/blog-preview';
import { ExploreFiltersProvider } from '@/lib/explore-filters';
import { FlightProvider } from '@/lib/flight';
import { goToSignIn, useSignedInId } from '@/lib/sign-in-gate';

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

// A plant or an article slides up from the bottom over the page it was opened from (and back down when
// closed); from the search it only fades, as its result already grew over the screen. Pages fade into each
// other. Chosen here, from the route, so it is known before the page is drawn.
const animationFor = (route: { name: string; params?: object }) => {
  const opensFromBelow = route.name.startsWith('plants/') || route.name.startsWith('wiki/[id]');
  const via = (route.params as { via?: string } | undefined)?.via;
  return opensFromBelow && via !== 'search' ? 'slide_from_bottom' : 'fade';
};

// Which bottom tab a page belongs to
const navIdFor = (pathname: string): NavId => {
  if (pathname.startsWith('/community')) return 'messages';
  if (pathname.startsWith('/wiki')) return 'wiki';
  if (pathname.startsWith('/results')) return 'results';
  if (pathname.startsWith('/profile')) return 'profile';
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

  const signedIn = useSignedInId() !== null;

  // The results tab shows the plants: all of them, or those of the filters already chosen. The profile
  // needs an account: signed out, the tab opens the sign-in page
  const navigate = (id: NavId) => {
    if (id === 'profile' && !signedIn) goToSignIn();
    else router.navigate(TAB_ROUTES[id]);
  };

  return (
    <>
      {/* Around the shell, so a tapped result or stage can grow over the whole screen */}
      <FlightProvider>
        <AppShell
          activeNavId={navIdFor(pathname)}
          onNavigate={navigate}
          signedIn={signedIn}
          // (those pages have buttons in that corner: the posts' send button, the results' filters button)
          hideSignInNote={pathname.startsWith('/community') || pathname.startsWith('/results')}
          // Everywhere but the home page (which has it big) and the plant pages (their section bar is there)
          showTitle={pathname !== '/' && !pathname.startsWith('/plants')}
          background={pathname === '/' ? 'scene' : 'plain'}>
          <ThemeProvider value={SHELL_THEME}>
            {/* Blue blog links in texts open their panel over any page */}
            <BlogPreviewProvider>
              <Stack screenOptions={({ route }) => ({ headerShown: false, animation: animationFor(route) })}>
                {/* Only with an account (a link to them while signed out leads home) */}
                <Stack.Protected guard={signedIn}>
                  <Stack.Screen name="profile/index" />
                  <Stack.Screen name="profile/password" />
                </Stack.Protected>
              </Stack>
            </BlogPreviewProvider>
          </ThemeProvider>
        </AppShell>
      </FlightProvider>
    </>
  );
}
