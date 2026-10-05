import { router, Stack, usePathname } from 'expo-router';
import { useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import type { NavId } from '@/config/app';
import { ExploreFiltersProvider } from '@/lib/explore-filters';

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
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
      </AppShell>
    </ExploreFiltersProvider>
  );
}
