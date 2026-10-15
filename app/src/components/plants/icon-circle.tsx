import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ICON_GRAY, type PlantIcon } from '@/config/plant-icons';
import { colors, iconSize, radius } from '@/theme';

/** A plant icon: light gray, in a circle of its faded colour (or light green with a green icon with `green`) */
export function IconCircle({ icon, size = 32, green }: { icon: PlantIcon; size?: number; green?: boolean }) {
  return (
    <View style={[styles.circle, { width: size, height: size, backgroundColor: green ? colors.primarySoft : icon.tint }]}>
      <Icon name={icon.icon} size={size > 28 ? iconSize.normal : iconSize.small} color={green ? colors.primary : ICON_GRAY} bold />
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
