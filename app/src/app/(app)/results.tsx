import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, SectionList, StyleSheet, View } from 'react-native';

import { FilterSheet, type ButtonFrame } from '@/components/filters/filter-sheet';
import { FiltersButton } from '@/components/filters/filters-button';
import { useTopClearance } from '@/components/layout/app-shell';
import { cardFromIndex, cardFromSummary, PlantCard, type PlantCardData } from '@/components/plants/plant-card';
import { AppText } from '@/components/ui/app-text';
import { CategoryTabs } from '@/components/ui/category-tabs';
import { PillButton } from '@/components/ui/pill-button';
import { KIND_TABS } from '@/config/plant-filters';
import { useExploreFilters } from '@/lib/explore-filters';
import { activeFilters, chosenCount, matchPlantFilters } from '@/lib/plant-filter-match';
import { usePlants } from '@/lib/plants';
import { useSearchIndex } from '@/lib/search';
import { colors, size, space } from '@/theme';

type Row = { card: PlantCardData; key: string };

/**
 * The plants. With no filter: the database's plants, newest first, more loading while scrolling.
 * With filters (the kind tabs, the Explore sheet or the Filters sheet): every plant matching all of
 * them, filtered on the phone from the search index, then «Σχετικά φυτά» matching some of them.
 */
export default function ResultsScreen() {
  const topClearance = useTopClearance();
  const { filters, setFilters } = useExploreFilters();
  const filtering = activeFilters(filters).length > 0;
  const kindTab = filters.kind?.[0] ?? 'all';

  const paged = usePlants();
  const { index, error: indexError, load } = useSearchIndex();
  useEffect(load, [load]);
  const plants = useMemo(() => index?.plants ?? [], [index]);
  const result = useMemo(() => (filtering ? matchPlantFilters(plants, filters) : null), [filtering, plants, filters]);

  const filtersButtonRef = useRef<View>(null);
  // Set while the filters sheet is open: where the button is, so the sheet's Submit button covers it exactly
  const [filtersFrame, setFiltersFrame] = useState<ButtonFrame | null>(null);
  const openFilters = () =>
    filtersButtonRef.current?.measureInWindow((x, y, width, height) => setFiltersFrame({ x, y, width, height }));

  const tabs = (
    <View style={styles.tabs}>
      <CategoryTabs
        tabs={KIND_TABS}
        activeId={kindTab}
        onChange={(id) => setFilters({ ...filters, kind: id === 'all' ? [] : [id] })}
      />
    </View>
  );

  const clearButton = <PillButton label="Καθαρισμός φίλτρων" onPress={() => setFilters({})} />;
  // Top clears the corner buttons; bottom leaves room for the floating filters button
  const listStyle = [styles.list, { paddingTop: topClearance }];

  return (
    <View style={styles.page}>
      {!filtering ? (
        <FlatList
          data={paged.plants}
          keyExtractor={(plant) => String(plant.id)}
          renderItem={({ item }) => <PlantCard plant={cardFromSummary(item)} />}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          ListHeaderComponent={tabs}
          onEndReached={paged.loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            paged.loading || paged.error ? null : (
              <AppText color={colors.inkMuted} style={styles.empty}>
                Δεν υπάρχουν φυτά ακόμα.
              </AppText>
            )
          }
          ListFooterComponent={
            paged.loading ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : paged.error ? (
              <View style={styles.footer}>
                <AppText color={colors.inkMuted} style={styles.empty}>
                  Δεν ήταν δυνατή η φόρτωση των φυτών.
                </AppText>
                <PillButton label="Δοκίμασε ξανά" onPress={paged.plants.length ? paged.loadMore : paged.refresh} />
              </View>
            ) : null
          }
          contentContainerStyle={listStyle}
        />
      ) : (
        <SectionList<Row>
          sections={[
            { key: 'matches', data: (result?.matches ?? []).map((p) => ({ card: cardFromIndex(p), key: `m${p.id}` })) },
            {
              key: 'related',
              data: (result?.related ?? []).map(({ plant }) => ({ card: cardFromIndex(plant), key: `r${plant.id}` })),
            },
          ]}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) => <PlantCard plant={item.card} />}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) =>
            section.key === 'related' && section.data.length > 0 ? (
              <View style={styles.relatedHeader}>
                <AppText bold accessibilityRole="header">
                  Σχετικά φυτά
                </AppText>
                <AppText size="small" color={colors.inkMuted}>
                  Ταιριάζουν σε μερικά από τα φίλτρα σου (τα περισσότερα πρώτα)
                </AppText>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <>
              {tabs}
              {index && result && result.matches.length === 0 && (
                <View style={styles.noMatches}>
                  <AppText color={colors.inkMuted}>
                    {result.related.length > 0 ? 'Κανένα φυτό με όλα τα φίλτρα.' : 'Κανένα φυτό με αυτά τα φίλτρα.'}
                  </AppText>
                  {clearButton}
                </View>
              )}
            </>
          }
          ListFooterComponent={
            !index ? (
              indexError ? (
                <View style={styles.footer}>
                  <AppText color={colors.inkMuted} style={styles.empty}>
                    Δεν ήταν δυνατή η φόρτωση των φυτών.
                  </AppText>
                  <PillButton label="Δοκίμασε ξανά" onPress={load} />
                </View>
              ) : (
                <ActivityIndicator color={colors.primary} style={styles.footer} />
              )
            ) : null
          }
          contentContainerStyle={listStyle}
        />
      )}

      {/* Stays in view at the bottom while the list scrolls; becomes Submit while the sheet is open */}
      <View ref={filtersButtonRef} collapsable={false} style={styles.filtersBar}>
        <FiltersButton onPress={openFilters} count={chosenCount({ ...filters, kind: [] })} />
      </View>

      {filtersFrame && <FilterSheet buttonFrame={filtersFrame} plants={plants} onClose={() => setFiltersFrame(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  list: {
    paddingHorizontal: space.md,
    paddingBottom: size.touch + space.md * 2,
  },
  tabs: {
    marginBottom: space.md,
  },
  gap: {
    height: space.sm,
  },
  empty: {
    marginTop: space.lg,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  noMatches: {
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  relatedHeader: {
    gap: space.xs,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  filtersBar: {
    position: 'absolute',
    right: space.md,
    bottom: space.md,
  },
});
