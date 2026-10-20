import { createContext, use, useState, type ReactNode } from 'react';

import { NO_FILTERS, type Selection } from '@/config/section-filters';

type ExploreFilters = {
  /** What the home screen's quick sheet chose; the results page starts both sections from it */
  selection: Selection;
  setSelection: (selection: Selection) => void;
};

const ExploreFiltersContext = createContext<ExploreFilters | null>(null);

/** The plant filters chosen on the home screen (config/section-filters.ts), handed to the results page */
export function ExploreFiltersProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(NO_FILTERS);

  return <ExploreFiltersContext value={{ selection, setSelection }}>{children}</ExploreFiltersContext>;
}

export function useExploreFilters() {
  const value = use(ExploreFiltersContext);
  if (!value) throw new Error('useExploreFilters must be used inside ExploreFiltersProvider');
  return value;
}
