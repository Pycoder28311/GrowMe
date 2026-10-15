import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { alpha, colors } from '@/theme';

/** The plant page's background: leaves with dew drops under a light white veil, fixed behind the page as it scrolls */
export function PlantBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={require('@/assets/images/backgrounds/plant-page.webp')}
        contentFit="cover"
        accessible={false}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.surface, 0.45) }]} />
    </View>
  );
}
