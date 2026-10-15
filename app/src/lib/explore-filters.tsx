import { router } from 'expo-router';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import type { Filters } from '@/config/plant-filters';

type ExploreFilters = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  /** «Επίλεξε φυτό»: straight to the results (no sheet in between) */
  openExplore: () => void;
};

const ExploreFiltersContext = createContext<ExploreFilters | null>(null);

/**
 * The chosen plant filters (config/plant-filters.ts), one selection shared by the home screen's
 * home button, the results page's Filters sheet and its place tabs.
 */
export function ExploreFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({});
  const openExplore = useCallback(() => router.navigate('/results'), []);

  return (
    <ExploreFiltersContext value={{ filters, setFilters, openExplore }}>
      {children}
    </ExploreFiltersContext>
  );
}

export function useExploreFilters() {
  const value = use(ExploreFiltersContext);
  if (!value) throw new Error('useExploreFilters must be used inside ExploreFiltersProvider');
  return value;
}
