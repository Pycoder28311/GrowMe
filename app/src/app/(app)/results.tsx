import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { FilterSheet, type ButtonFrame } from '@/components/filters/filter-sheet';
import { FiltersButton } from '@/components/filters/filters-button';
import { useTopClearance } from '@/components/layout/app-shell';
import { PlantCard } from '@/components/plants/plant-card';
import { AppText } from '@/components/ui/app-text';
import { CategoryTabs } from '@/components/ui/category-tabs';
import { PillButton } from '@/components/ui/pill-button';
import { CATEGORY_TABS } from '@/config/filters';
import { usePlants } from '@/lib/plants';
import { colors, size, space } from '@/theme';

/**
 * The plants from the database, newest first; more load while scrolling.
 * The category tabs and the Explore filters don't filter yet: the database has no plant types so far.
 */
export default function ResultsScreen() {
  const topClearance = useTopClearance();
  const [categoryId, setCategoryId] = useState('all');
  const { plants, loading, error, loadMore, refresh } = usePlants();
  const filtersButtonRef = useRef<View>(null);
  // Set while the filters sheet is open: where the button is, so the sheet's Submit button covers it exactly
  const [filtersFrame, setFiltersFrame] = useState<ButtonFrame | null>(null);

  const openFilters = () =>
    filtersButtonRef.current?.measureInWindow((x, y, width, height) => setFiltersFrame({ x, y, width, height }));

  return (
    <View style={styles.page}>
      <FlatList
        data={plants}
        keyExtractor={(plant) => String(plant.id)}
        renderItem={({ item }) => <PlantCard plant={item} />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListHeaderComponent={
          <View style={styles.tabs}>
            <CategoryTabs tabs={CATEGORY_TABS} activeId={categoryId} onChange={setCategoryId} />
          </View>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading || error ? null : (
            <AppText color={colors.inkMuted} style={styles.empty}>
              Δεν υπάρχουν φυτά ακόμα.
            </AppText>
          )
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : error ? (
            <View style={styles.footer}>
              <AppText color={colors.inkMuted} style={styles.empty}>
                Δεν ήταν δυνατή η φόρτωση των φυτών.
              </AppText>
              <PillButton label="Δοκίμασε ξανά" onPress={plants.length ? loadMore : refresh} />
            </View>
          ) : null
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
  footer: {
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  filtersBar: {
    position: 'absolute',
    right: space.md,
    bottom: space.md,
  },
});
