import type { SearchPlant } from '@growme/shared';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

import { BotanicalBackground } from '@/components/layout/botanical-background';
import { useTopClearance } from '@/components/layout/app-shell';
import { TopGradient } from '@/components/layout/top-gradient';
import { TopWash } from '@/components/layout/top-wash';
import { cardFromIndex, PlantCard } from '@/components/plants/plant-card';
import { SectionFilterSheet } from '@/components/results/section-filter-sheet';
import { SectionTools } from '@/components/results/section-tools';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import type { SectionId, Selection } from '@/config/section-filters';
import { useBackgroundScroll, useBackgroundScrollHandler } from '@/lib/background-motion';
import { useExploreFilters } from '@/lib/explore-filters';
import { chosenCount, matchPlantFilters } from '@/lib/plant-filter-match';
import { useSearchIndex } from '@/lib/search';
import { alpha, BACKGROUND_DECORATIONS, botanical, colors, iconSize, size, type BackgroundDecoration, space, titleFont } from '@/theme';

/** The plant page's edge shapes with a flower where its leaf was (at the left): flowers only, with more of them */
const FLOWERS_ONLY: readonly BackgroundDecoration[] = [
  ...BACKGROUND_DECORATIONS.map((shape): BackgroundDecoration =>
    shape.kind === 'leaf' ? { ...shape, kind: 'flower', color: botanical.coral, center: botanical.butter, opacity: 0.95, rotate: 18 } : shape,
  ),
  // And one more, further down on the left
  { kind: 'flower', size: 130, color: botanical.butter, center: botanical.terracotta, opacity: 0.6, rotate: -20, side: 'left', y: 1250 },
];

const OTHER: Record<SectionId, SectionId> = { indoor: 'outdoor', outdoor: 'indoor' };

const TOGGLE_MS = 250;
/** How far the open section starts above its place, behind the row */
const SLIDE = 56;

/** The section opening: it comes down from behind the row, fading in */
const slideFromBehind = (values: { targetOriginY: number }) => {
  'worklet';
  return {
    initialValues: { originY: values.targetOriginY - SLIDE, opacity: 0 },
    animations: {
      originY: withTiming(values.targetOriginY, { duration: TOGGLE_MS, easing: Easing.out(Easing.cubic) }),
      opacity: withTiming(1, { duration: TOGGLE_MS }),
    },
  };
};
/** And closing: it goes back up behind the row */
const slideBehind = (values: { currentOriginY: number }) => {
  'worklet';
  return {
    initialValues: { originY: values.currentOriginY, opacity: 1 },
    animations: {
      originY: withTiming(values.currentOriginY - SLIDE, { duration: TOGGLE_MS / 1.5, easing: Easing.in(Easing.cubic) }),
      opacity: withTiming(0, { duration: TOGGLE_MS / 1.5 }),
    },
  };
};

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

  // The band behind the row is there only while closed
  const band = useAnimatedStyle(() => ({ opacity: reduced ? (open ? 0 : 1) : withTiming(open ? 0 : 1, { duration: TOGGLE_MS }) }));

  // The arrow points down while open and turns to the side when closed
  const arrow = useAnimatedStyle(() => ({
    transform: [{ rotate: reduced ? (open ? '90deg' : '0deg') : withTiming(open ? '90deg' : '0deg', { duration: TOGGLE_MS }) }],
  }));

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={styles.header}>
        {/* The row's band (edge to edge, square corners) fades in when it is closed and away when it opens */}
        <Animated.View pointerEvents="none" style={[styles.band, band]} />
        <AppText size="big" bold accessibilityRole="header" style={[styles.title, titleFont]}>
          {title}
        </AppText>
        <Animated.View style={arrow}>
          <Icon name="chevronRight" size={iconSize.big} color={colors.ink} bold />
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View entering={reduced ? undefined : slideFromBehind} exiting={reduced ? undefined : slideBehind} style={styles.body}>
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
    </View>
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
  const backgroundScroll = useBackgroundScrollHandler();
  const scrollY = useBackgroundScroll();
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
      {/* The plant page's own faint flowers and leaf at the edges, behind the cards, drifting and pushed out as the page scrolls */}
      <BotanicalBackground scrollY={scrollY} decorations={FLOWERS_ONLY} />
      <TopGradient />
      <TopWash />
      <Animated.ScrollView
        onScroll={backgroundScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingTop: topClearance + space.sm }]}>
        <PlantSection
          title="Φυτά εσωτερικού χώρου"
          searchLabel="Αναζήτηση"
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
          searchLabel="Αναζήτηση"
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
      </Animated.ScrollView>

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
    gap: space.md,
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  section: {
    gap: space.sm,
    justifyContent: 'flex-start',
  },
  // The label and its arrow, over everything the section shows: edge to edge (the list's side padding taken back), the
  // label inset as far as the cards' contents; the same open or closed, so the label never changes width
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    // Exactly one row high and never stretched or squeezed, whatever size the section is while it opens or closes
    height: size.touch,
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: -space.md,
    paddingHorizontal: space.md + space.sm,
    zIndex: 2,
  },
  // The closed row's white band: full width, no rounded corners, lines above and below
  band: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha(colors.surface, 0.95),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    flex: 1,
  },
  body: {
    gap: space.md,
    zIndex: 1,
  },
  cards: {
    gap: space.md,
  },
  empty: {
    textAlign: 'center',
  },
  relatedLabel: {
    marginTop: space.md,
  },
});
