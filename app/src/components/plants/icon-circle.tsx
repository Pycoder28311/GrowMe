import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ICON_GRAY, type PlantIcon } from '@/config/plant-icons';
import { iconSize, radius } from '@/theme';

/** A plant icon: light gray, in a circle of its faded colour */
export function IconCircle({ icon, size = 32 }: { icon: PlantIcon; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, backgroundColor: icon.tint }]}>
      <Icon name={icon.icon} size={size > 28 ? iconSize.normal : iconSize.small} color={ICON_GRAY} bold />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
});
