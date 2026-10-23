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
import { colors, iconSize, mixColor, radius, size, space } from '@/theme';

/** The page's green a little lighter than the other buttons' */
const LIGHT_GREEN = mixColor(colors.primary, '#ffffff', 0.18);

type FiltersButtonProps = {
  /** While the filters sheet is open the same button submits it */
  submit?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** How many filter options are chosen (a badge when more than 0) */
  count?: number;
  /** Appears showing the other side and turns over at once (the sheet's Submit, over the page's Filters) */
  flipIn?: boolean;
};

/** Half a flip: the button turns away edge-on (to 90°), then its other side turns in (from −90°) */
const HALF_FLIP_MS = 180;

/**
 * The results page's floating green button: "Φίλτρα", or "Υποβολή" while the filters sheet is open.
 * The whole button turns over vertically, like a card, to show the other word (with Reduce Motion the
 * word just changes).
 */
export function FiltersButton({ submit = false, onPress, style, count = 0, flipIn = false }: FiltersButtonProps) {
  const reduced = useReducedMotion();
  // The side on show lags behind `submit` until the turn is half way
  const [shown, setShown] = useState(flipIn ? !submit : submit);
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

  const flip = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${turn.get()}deg` }] }));

  return (
    <Animated.View style={[style, flip]}>
      <ActionButton size="md" color="green" fill={LIGHT_GREEN} height={size.touch} edge={false} glow="soft" onPress={onPress}>
        {shown ? <SubmitLabel /> : <FiltersLabel count={count} />}
      </ActionButton>
    </Animated.View>
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
          <AppText size="small" bold color={colors.primary}>
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
