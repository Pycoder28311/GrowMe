import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ActionButton, ActionButtonText } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { colors, iconSize, radius, space } from '@/theme';

type FiltersButtonProps = {
  /** While the filters sheet is open the same button submits it */
  submit?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** How many filter options are chosen (a badge when more than 0) */
  count?: number;
};

/** Half a flip: the label turns away (to 90°), then the other one turns in (from −90°) */
const HALF_FLIP_MS = 150;

/**
 * The results page's floating button: "Φίλτρα", or "Υποβολή" while the filters sheet is open. The
 * label flips over vertically to change (with Reduce Motion it just changes).
 */
export function FiltersButton({ submit = false, onPress, style, count = 0 }: FiltersButtonProps) {
  const reduced = useReducedMotion();
  // The label on show lags behind `submit` until the flip is half way
  const [shown, setShown] = useState(submit);
  const turn = useSharedValue(0);

  useEffect(() => {
    if (submit === shown) return;
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no flip: the label just changes
      setShown(submit);
      return;
    }
    turn.set(
      withSequence(
        withTiming(90, { duration: HALF_FLIP_MS, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(setShown, submit);
        }),
        withTiming(-90, { duration: 0 }),
        withTiming(0, { duration: HALF_FLIP_MS, easing: Easing.out(Easing.quad) }),
      ),
    );
  }, [submit, shown, reduced, turn]);

  const flip = useAnimatedStyle(() => ({ transform: [{ perspective: 400 }, { rotateX: `${turn.get()}deg` }] }));

  return (
    <ActionButton size="md" edge={false} glow="soft" onPress={onPress} style={style}>
      <Animated.View style={flip}>{shown ? <SubmitLabel /> : <FiltersLabel count={count} />}</Animated.View>
    </ActionButton>
  );
}

function SubmitLabel() {
  return (
    <View style={styles.label}>
      <Icon name="check" size={iconSize.normal} color={colors.surface} bold />
      <ActionButtonText>Υποβολή</ActionButtonText>
    </View>
  );
}

function FiltersLabel({ count }: { count: number }) {
  return (
    <View style={styles.label}>
      <Icon name="filter" size={iconSize.normal} color={colors.surface} bold />
      <ActionButtonText>Φίλτρα</ActionButtonText>
      {count > 0 && (
        <View style={styles.badge} accessibilityLabel={`${count} επιλεγμένα`}>
          <AppText size="small" bold color={colors.accent}>
            {count}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  badge: {
    minWidth: iconSize.normal,
    paddingHorizontal: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
});
