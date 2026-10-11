import type { PostPlant, SearchPlant } from '@growme/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TextInput, View } from 'react-native';

import { ResultRowContent } from '@/components/search/result-row';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet, type BottomSheetHandle } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { PillButton } from '@/components/ui/pill-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useSearchIndex } from '@/lib/search';
import { matchPlants } from '@/lib/search-match';
import { colors, fontFamily, fontSize, iconSize, radius, shadow, size, space } from '@/theme';

/** What a picked plant keeps for its post: its id, name and cover */
export const postPlantOf = (plant: SearchPlant): PostPlant => ({ id: plant.id, name: plant.name, image: plant.image });

/**
 * Pick the plant a post is about, in the panel from below: every plant (the search's index), in the
 * search's rows, narrowed as you type. Picking one closes the panel.
 */
export function PlantPicker({ onPick, onClose }: { onPick: (plant: PostPlant) => void; onClose: () => void }) {
  const { index, error, load } = useSearchIndex();
  const [query, setQuery] = useState('');
  const sheet = useRef<BottomSheetHandle>(null);
  const picked = useRef<PostPlant | null>(null);

  useEffect(() => load(), [load]);

  const plants = useMemo(() => {
    if (!index) return [];
    return query.trim()
      ? matchPlants(index.plants, query)
      : [...index.plants].sort((a, b) => a.name.localeCompare(b.name, 'el'));
  }, [index, query]);

  // The panel slides away first, then the form gets the plant
  const pick = (plant: SearchPlant) => {
    picked.current = postPlantOf(plant);
    sheet.current?.close();
  };
  const closed = () => {
    if (picked.current) onPick(picked.current);
    onClose();
  };

  return (
    <BottomSheet ref={sheet} title="Σύνδεση με φυτό" initialSnap="full" onClose={closed}>
      <View style={styles.body}>
        <View style={styles.search}>
          <Icon name="search" size={iconSize.normal} color={colors.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Αναζήτηση φυτού..."
            placeholderTextColor={colors.inkMuted}
            accessibilityLabel="Αναζήτηση φυτού"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        {!index && !error && <ActivityIndicator color={colors.primary} style={styles.status} />}
        {error && (
          <View style={styles.status}>
            <AppText color={colors.inkMuted}>Δεν ήταν δυνατή η φόρτωση των φυτών.</AppText>
            <PillButton label="Δοκίμασε ξανά" onPress={load} />
          </View>
        )}
        {index && plants.length === 0 && (
          <AppText color={colors.inkMuted} style={styles.status}>
            Κανένα φυτό
          </AppText>
        )}

        {plants.map((plant) => (
          <PressableScale
            key={plant.id}
            accessibilityRole="button"
            accessibilityLabel={plant.name}
            pressedScale={0.98}
            onPress={() => pick(plant)}
            style={styles.card}>
            <ResultRowContent result={{ type: 'plant', item: plant }} />
          </PressableScale>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: space.sm,
    // Room for the rows' shadows at the sides
    paddingHorizontal: space.xs,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: size.touch,
    marginBottom: space.xs,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xs,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
    paddingVertical: space.sm,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  // The search results' rows
  card: {
    borderRadius: radius.xs,
    boxShadow: shadow.tile,
  },
  status: {
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    textAlign: 'center',
  },
});
