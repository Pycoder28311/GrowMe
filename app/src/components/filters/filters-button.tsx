import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { Icon } from '@/components/ui/icon';
import { colors, iconSize, space } from '@/theme';

type FiltersButtonProps = {
  /** While the filters sheet is open the same button submits it */
  submit?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** The results page's floating button: "Φίλτρα", or "Υποβολή" while the filters sheet is open */
export function FiltersButton({ submit, onPress, style }: FiltersButtonProps) {
  return (
    <ActionButton size="md" edge={false} glow="soft" onPress={onPress} style={style}>
      {submit ? (
        // The new label fades in over the unchanged button
        <Animated.View entering={FadeIn.duration(200)} style={styles.label}>
          <Icon name="check" size={iconSize.normal} color={colors.surface} bold />
          <ActionButtonText>Υποβολή</ActionButtonText>
        </Animated.View>
      ) : (
        <View style={styles.label}>
          <Icon name="filter" size={iconSize.normal} color={colors.surface} bold />
          <ActionButtonText>Φίλτρα</ActionButtonText>
        </View>
      )}
    </ActionButton>
  );
}

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
