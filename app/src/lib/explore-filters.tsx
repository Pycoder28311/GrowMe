import { router } from 'expo-router';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { ExploreSheet } from '@/components/explore/explore-sheet';
import type { Filters } from '@/config/plant-filters';

type ExploreFilters = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  /** Opens the quick filters sheet («Επίλεξε φυτό»); applying it shows the results */
  openExplore: () => void;
};

const ExploreFiltersContext = createContext<ExploreFilters | null>(null);

/**
 * The chosen plant filters (config/plant-filters.ts), one selection shared by the home screen's
 * Explore sheet, the results page's Filters sheet and its kind tabs. The Explore sheet itself lives
 * here, so any page (the home button, the bottom bar's results tab) can open it.
 */
export function ExploreFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({});
  const [exploring, setExploring] = useState(false);
  const openExplore = useCallback(() => setExploring(true), []);

  const handleClose = (applied: Filters | null) => {
    setExploring(false);
    if (!applied) return;
    setFilters(applied);
    router.navigate('/results');
  };

  return (
    <ExploreFiltersContext value={{ filters, setFilters, openExplore }}>
      {children}
      {exploring && <ExploreSheet initialFilters={filters} onClose={handleClose} />}
    </ExploreFiltersContext>
  );
}

export function useExploreFilters() {
  const value = use(ExploreFiltersContext);
  if (!value) throw new Error('useExploreFilters must be used inside ExploreFiltersProvider');
  return value;
}
