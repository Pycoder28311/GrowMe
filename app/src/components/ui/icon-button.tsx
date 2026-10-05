import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { raisedTile, tileIcon } from '@/components/ui/styles';
import { alpha, colors, iconSize } from '@/theme';

type IconButtonProps = {
  icon: IconName;
  /** Read by screen readers (the button shows only an icon) */
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Square white tile with an icon (the corner buttons) */
export function IconButton({ icon, label, onPress, style }: IconButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      pressedScale={0.94}
      style={[raisedTile, styles.button, style]}>
      <Icon name={icon} size={iconSize.big} color={colors.ink} style={tileIcon} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.surface, 0.95),
  },
});
