import { DefaultTheme, router, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import type { NavId } from '@/config/app';
import { ExploreFiltersProvider } from '@/lib/explore-filters';

// The pages paint no background of their own, so the shell's photos and washes show through
// (the navigation theme's background would cover them: black in dark mode). The design is light only.
const SHELL_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

// Which bottom tab a page belongs to
const navIdFor = (pathname: string): NavId =>
  pathname.startsWith('/settings') || pathname.startsWith('/notes') ? 'settings' : 'home';

/** Signed-in pages inside the shared frame (background, corner buttons, bottom nav) */
export default function AppLayout() {
  const pathname = usePathname();
  // Messages and Encyclopedia have no pages yet: tapping them only moves the indicator, until the page changes
  const [placeholder, setPlaceholder] = useState<{ id: NavId; pathname: string } | null>(null);
  const activeNavId = placeholder?.pathname === pathname ? placeholder.id : navIdFor(pathname);

  const navigate = (id: NavId) => {
    setPlaceholder(null);
    if (id === 'home') router.navigate('/');
    else if (id === 'settings') router.navigate('/settings');
    else setPlaceholder({ id, pathname });
  };

  return (
    <ExploreFiltersProvider>
      <AppShell activeNavId={activeNavId} onNavigate={navigate} background={pathname === '/' ? 'scene' : 'plain'}>
        <ThemeProvider value={SHELL_THEME}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </ThemeProvider>
      </AppShell>
    </ExploreFiltersProvider>
  );
}
