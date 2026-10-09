import { createContext, use, useState, type ReactNode } from 'react';

import type { Filters } from '@/config/plant-filters';

type ExploreFilters = { filters: Filters; setFilters: (filters: Filters) => void };

const ExploreFiltersContext = createContext<ExploreFilters | null>(null);

/**
 * The chosen plant filters (config/plant-filters.ts), one selection shared by the home screen's
 * Explore sheet, the results page's Filters sheet and its kind tabs
 */
export function ExploreFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({});
  return <ExploreFiltersContext value={{ filters, setFilters }}>{children}</ExploreFiltersContext>;
}

export function useExploreFilters() {
  const value = use(ExploreFiltersContext);
  if (!value) throw new Error('useExploreFilters must be used inside ExploreFiltersProvider');
  return value;
}
