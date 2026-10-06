import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import type { Plant } from '@/config/plants';
import { colors, radius, size, space } from '@/theme';

const TILE = size.touch * 2;

/** A row of small plant tiles that scrolls sideways; tapping one opens its page */
export function RelatedPlants({ plants }: { plants: Plant[] }) {
  return (
    // Bleeds to the screen edges so tiles scroll in from the side, while lining up with the page
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller} contentContainerStyle={styles.row}>
      {plants.map((plant) => (
        <PressableScale
          key={plant.id}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/plants/[id]', params: { id: plant.id } })}
          style={styles.tile}>
          <Image source={plant.image} contentFit="cover" style={styles.photo} />
          <View style={styles.caption}>
            <AppText bold numberOfLines={1}>
              {plant.name}
            </AppText>
            <AppText size="small" bold color={colors.accent}>
              {plant.price.min}–{plant.price.max} €
            </AppText>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    marginHorizontal: -space.md,
  },
  row: {
    gap: space.sm,
    paddingHorizontal: space.md,
    // Room for the cards' shadows
    paddingVertical: space.xs,
  },
  tile: {
    ...card,
    width: TILE,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: TILE,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  caption: {
    padding: space.sm,
  },
});
