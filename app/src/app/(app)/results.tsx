import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { useTopClearance } from '@/components/layout/app-shell';
import { CategoryTabs } from '@/components/plants/category-tabs';
import { PlantCard } from '@/components/plants/plant-card';
import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { CATEGORY_TABS, matchesFilters } from '@/config/filters';
import { PLANTS } from '@/config/plants';
import { useExploreFilters } from '@/lib/explore-filters';
import { colors, iconSize, size, space } from '@/theme';

/** Plants matching the Explore filters, narrowed further by the category tabs */
export default function ResultsScreen() {
  const topClearance = useTopClearance();
  const { filters } = useExploreFilters();
  const [categoryId, setCategoryId] = useState('all');
  const category = CATEGORY_TABS.find((tab) => tab.id === categoryId) ?? CATEGORY_TABS[0];
  const plants = PLANTS.filter((plant) => matchesFilters(plant, filters) && category.matches(plant));

  return (
    <View style={styles.page}>
      <FlatList
        data={plants}
        keyExtractor={(plant) => plant.id}
        renderItem={({ item }) => <PlantCard plant={item} />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListHeaderComponent={
          <View style={styles.tabs}>
            <CategoryTabs activeId={categoryId} onChange={setCategoryId} />
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

      {/* Stays in view at the bottom while the list scrolls; not wired up yet */}
      <View pointerEvents="box-none" style={styles.filtersBar}>
        <ActionButton size="md" edge={false} glow="soft">
          <View style={styles.filtersLabel}>
            <Icon name="filter" size={iconSize.normal} color={colors.surface} bold />
            <ActionButtonText>Φίλτρα</ActionButtonText>
          </View>
        </ActionButton>
      </View>
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
  filtersLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
