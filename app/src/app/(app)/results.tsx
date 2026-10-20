import { useMemo, useState } from 'react';
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
import { PlantCard, type PlantCardData } from '@/components/plants/plant-card';
import { SectionFilterSheet } from '@/components/results/section-filter-sheet';
import { SectionTools } from '@/components/results/section-tools';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { card } from '@/components/ui/styles';
import { MOCK_INDOOR_PLANTS, MOCK_OUTDOOR_PLANTS } from '@/config/mock-results';
import { chosenCount, NO_FILTERS, type SectionFilters, type SectionId } from '@/config/section-filters';
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
  plants: PlantCardData[];
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
function PlantSection({ title, searchLabel, plants, filterCount, open, onToggle, onEngage, onFilters }: PlantSectionProps) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const words = plain(query.trim());
    return words ? plants.filter((p) => plain(`${p.name} ${p.scientificName}`).includes(words)) : plants;
  }, [plants, query]);

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
            {shown.map((plant) => (
              // A mockup: the cards open nothing (their plants don't exist in the backend)
              <PlantCard key={plant.id} plant={plant} onPress={() => {}} />
            ))}
            {shown.length === 0 && (
              <AppText color={colors.inkMuted} style={styles.empty}>
                Κανένα φυτό με αυτό το όνομα.
              </AppText>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * The plants page, a mockup with fake plants (config/mock-results.ts, nothing from the backend): a section
 * of indoor plants and, below it, one of outdoor plants. Each has a filter button and a search bar under its
 * label. Using one section's search bar or filter button folds the other section into a button with an arrow,
 * which opens it again (and closes it) when tapped.
 */
export default function ResultsScreen() {
  const topClearance = useTopClearance();
  const [closed, setClosed] = useState<Record<SectionId, boolean>>({ indoor: false, outdoor: false });

  const engage = (id: SectionId) => setClosed({ [id]: false, [OTHER[id]]: true } as Record<SectionId, boolean>);
  // Each section's filters, and the section whose filters sheet is open
  const [filters, setFilters] = useState<Record<SectionId, SectionFilters>>({ indoor: NO_FILTERS, outdoor: NO_FILTERS });
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
          plants={MOCK_INDOOR_PLANTS}
          open={!closed.indoor}
          onToggle={() => toggle('indoor')}
          onEngage={() => engage('indoor')}
          filterCount={chosenCount(filters.indoor, 'indoor')}
          onFilters={() => openFilters('indoor')}
        />
        <PlantSection
          title="Φυτά εξωτερικού χώρου"
          searchLabel="Αναζήτηση σε φυτά εξωτερικού χώρου"
          plants={MOCK_OUTDOOR_PLANTS}
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
});
