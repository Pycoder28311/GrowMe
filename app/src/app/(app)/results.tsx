import type { SearchPlant } from '@growme/shared';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

import { useTopClearance } from '@/components/layout/app-shell';
import { TopGradient } from '@/components/layout/top-gradient';
import { cardFromIndex, PlantCard } from '@/components/plants/plant-card';
import { SectionFilterSheet } from '@/components/results/section-filter-sheet';
import { SectionTools } from '@/components/results/section-tools';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { card } from '@/components/ui/styles';
import type { SectionId, Selection } from '@/config/section-filters';
import { useExploreFilters } from '@/lib/explore-filters';
import { chosenCount, matchPlantFilters } from '@/lib/plant-filter-match';
import { useSearchIndex } from '@/lib/search';
import { colors, iconSize, radius, size, space } from '@/theme';

const OTHER: Record<SectionId, SectionId> = { indoor: 'outdoor', outdoor: 'indoor' };

const TOGGLE_MS = 250;

/** Lowercase without accents, so «ελια» finds «Ελιά» */
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

type PlantSectionProps = {
  title: string;
  searchLabel: string;
  section: SectionId;
  /** The plants that live in this section (the search index's, indoor or outdoor) */
  plants: SearchPlant[];
  /** This section's chosen filters */
  selection: Selection;
  /** The index is still loading, or failed to load (then `onRetry` tries again) */
  status: 'loading' | 'error' | 'ready';
  onRetry: () => void;
  /** How many filters are chosen in this section (for the button's badge) */
  filterCount: number;
  open: boolean;
  onToggle: () => void;
  /** The search bar or the filter button was used: the other section folds away */
  onEngage: () => void;
  /** The filter button: opens this section's filters */
  onFilters: () => void;
};

/**
 * One section of the page: its label (a button with an arrow that opens and closes the section), then, while
 * open, a filter button and a search bar and its plants. Closed, only the label shows, as a white button.
 */
function PlantSection({
  title,
  searchLabel,
  section,
  plants,
  selection,
  status,
  onRetry,
  filterCount,
  open,
  onToggle,
  onEngage,
  onFilters,
}: PlantSectionProps) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState('');
  // The name search first, then the section's filters: the plants that pass all, and the related ones
  const { matches, related } = useMemo(() => {
    const words = plain(query.trim());
    const found = words ? plants.filter((p) => plain(`${p.name} ${p.scientificName}`).includes(words)) : plants;
    return matchPlantFilters(found, selection, section);
  }, [plants, query, selection, section]);

  // The arrow points down while open and turns to the side when closed
  const arrow = useAnimatedStyle(() => ({
    transform: [{ rotate: reduced ? (open ? '90deg' : '0deg') : withTiming(open ? '90deg' : '0deg', { duration: TOGGLE_MS }) }],
  }));

  return (
    <Animated.View layout={reduced ? undefined : LinearTransition.duration(TOGGLE_MS)} style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={[styles.header, !open && styles.headerClosed]}>
        <AppText size="big" bold accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
        <Animated.View style={arrow}>
          <Icon name="chevronRight" size={iconSize.big} color={colors.ink} bold />
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View entering={reduced ? undefined : FadeIn.duration(TOGGLE_MS)} exiting={reduced ? undefined : FadeOut.duration(TOGGLE_MS / 2)} style={styles.body}>
          <SectionTools placeholder={searchLabel} value={query} onChangeText={setQuery} onSearchFocus={onEngage} onFilters={onFilters} filterCount={filterCount} />
          <View style={styles.cards}>
            {status === 'loading' && <AppText color={colors.inkMuted} style={styles.empty}>Φόρτωση φυτών…</AppText>}
            {status === 'error' && (
              <Pressable accessibilityRole="button" onPress={onRetry}>
                <AppText color={colors.accent} style={styles.empty}>
                  Δεν φορτώθηκαν τα φυτά. Πάτησε για να δοκιμάσεις ξανά.
                </AppText>
              </Pressable>
            )}
            {matches.map((plant) => (
              <PlantCard key={plant.id} plant={cardFromIndex(plant)} />
            ))}
            {status === 'ready' && matches.length === 0 && (
              <AppText color={colors.inkMuted} style={styles.empty}>
                Κανένα φυτό δεν ταιριάζει.
              </AppText>
            )}
            {related.length > 0 && (
              <>
                <AppText bold style={styles.relatedLabel}>
                  Παρόμοια αποτελέσματα
                </AppText>
                {related.map(({ plant }) => (
                  <PlantCard key={plant.id} plant={cardFromIndex(plant)} />
                ))}
              </>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * The plants page: the search index's plants in a section of indoor plants and, below it, one of outdoor plants,
 * each filtered by its own filters (config/section-filters.ts). Each has a filter button and a search bar under its
 * label. Using one section's search bar or filter button folds the other section into a button with an arrow,
 * which opens it again (and closes it) when tapped.
 */
export default function ResultsScreen() {
  const topClearance = useTopClearance();
  const [closed, setClosed] = useState<Record<SectionId, boolean>>({ indoor: false, outdoor: false });

  const engage = (id: SectionId) => setClosed({ [id]: false, [OTHER[id]]: true } as Record<SectionId, boolean>);
  // Each section's filters, and the section whose filters sheet is open
  // They start from what the home screen's quick sheet chose
  const { selection: quick } = useExploreFilters();
  const [filters, setFilters] = useState<Record<SectionId, Selection>>({ indoor: quick, outdoor: quick });
  // A new choice on the home screen starts both sections again (set while rendering, not in an effect)
  const [startedFrom, setStartedFrom] = useState(quick);
  if (startedFrom !== quick) {
    setStartedFrom(quick);
    setFilters({ indoor: quick, outdoor: quick });
  }
  const { index, error, load } = useSearchIndex();
  useEffect(load, [load]);
  const status = index ? 'ready' : error ? 'error' : 'loading';
  const inSection = useMemo(
    () => ({
      indoor: (index?.plants ?? []).filter((p) => p.indoor),
      outdoor: (index?.plants ?? []).filter((p) => p.outdoor),
    }),
    [index],
  );
  const [sheet, setSheet] = useState<SectionId | null>(null);
  const openFilters = (id: SectionId) => {
    engage(id);
    setSheet(id);
  };
  const toggle = (id: SectionId) => setClosed((current) => ({ ...current, [id]: !current[id] }));

  return (
    <View style={styles.page}>
      <TopGradient />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingTop: topClearance + space.md - space.sm }]}>
        <PlantSection
          title="Φυτά εσωτερικού χώρου"
          searchLabel="Αναζήτηση σε φυτά εσωτερικού χώρου"
          section="indoor"
          plants={inSection.indoor}
          selection={filters.indoor}
          status={status}
          onRetry={load}
          open={!closed.indoor}
          onToggle={() => toggle('indoor')}
          onEngage={() => engage('indoor')}
          filterCount={chosenCount(filters.indoor, 'indoor')}
          onFilters={() => openFilters('indoor')}
        />
        <PlantSection
          title="Φυτά εξωτερικού χώρου"
          searchLabel="Αναζήτηση σε φυτά εξωτερικού χώρου"
          section="outdoor"
          plants={inSection.outdoor}
          selection={filters.outdoor}
          status={status}
          onRetry={load}
          open={!closed.outdoor}
          onToggle={() => toggle('outdoor')}
          onEngage={() => engage('outdoor')}
          filterCount={chosenCount(filters.outdoor, 'outdoor')}
          onFilters={() => openFilters('outdoor')}
        />
      </ScrollView>

      {sheet && (
        <SectionFilterSheet
          section={sheet}
          filters={filters[sheet]}
          onSubmit={(next) => setFilters((current) => ({ ...current, [sheet]: next }))}
          onClose={() => setSheet(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  list: {
    gap: space.lg,
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  section: {
    gap: space.sm,
  },
  // The label and its arrow; closed, a white button like the cards
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    minHeight: size.touch,
  },
  headerClosed: {
    ...card,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
  },
  title: {
    flex: 1,
  },
  body: {
    gap: space.sm,
  },
  cards: {
    gap: space.sm,
  },
  empty: {
    textAlign: 'center',
  },
  relatedLabel: {
    marginTop: space.md,
  },
});
