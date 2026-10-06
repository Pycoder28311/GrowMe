import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { FilterSheet, type ButtonFrame } from '@/components/filters/filter-sheet';
import { FiltersButton } from '@/components/filters/filters-button';
import { useTopClearance } from '@/components/layout/app-shell';
import { PlantCard } from '@/components/plants/plant-card';
import { AppText } from '@/components/ui/app-text';
import { CategoryTabs } from '@/components/ui/category-tabs';
import { CATEGORY_TABS, matchesFilters } from '@/config/filters';
import { PLANTS } from '@/config/plants';
import { useExploreFilters } from '@/lib/explore-filters';
import { colors, size, space } from '@/theme';

/** Plants matching the Explore filters, narrowed further by the category tabs */
export default function ResultsScreen() {
  const topClearance = useTopClearance();
  const { filters } = useExploreFilters();
  const [categoryId, setCategoryId] = useState('all');
  const category = CATEGORY_TABS.find((tab) => tab.id === categoryId) ?? CATEGORY_TABS[0];
  const plants = PLANTS.filter((plant) => matchesFilters(plant, filters) && category.matches(plant));
  const filtersButtonRef = useRef<View>(null);
  // Set while the filters sheet is open: where the button is, so the sheet's Submit button covers it exactly
  const [filtersFrame, setFiltersFrame] = useState<ButtonFrame | null>(null);

  const openFilters = () =>
    filtersButtonRef.current?.measureInWindow((x, y, width, height) => setFiltersFrame({ x, y, width, height }));

  return (
    <View style={styles.page}>
      <FlatList
        data={plants}
        keyExtractor={(plant) => plant.id}
        renderItem={({ item }) => <PlantCard plant={item} />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListHeaderComponent={
          <View style={styles.tabs}>
            <CategoryTabs tabs={CATEGORY_TABS} activeId={categoryId} onChange={setCategoryId} />
          </View>
        }
        ListEmptyComponent={
          <AppText color={colors.inkMuted} style={styles.empty}>
            Δεν βρέθηκαν φυτά με αυτά τα φίλτρα.
          </AppText>
        }
        // Top clears the corner buttons; bottom leaves room for the floating filters button
        contentContainerStyle={[styles.list, { paddingTop: topClearance }]}
      />

      {/* Stays in view at the bottom while the list scrolls; becomes Submit while the sheet is open */}
      <View ref={filtersButtonRef} collapsable={false} style={styles.filtersBar}>
        <FiltersButton onPress={openFilters} />
      </View>

      {filtersFrame && <FilterSheet buttonFrame={filtersFrame} onClose={() => setFiltersFrame(null)} />}
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
  filtersBar: {
    position: 'absolute',
    right: space.md,
    bottom: space.md,
  },
});
