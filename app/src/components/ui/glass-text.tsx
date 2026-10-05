import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { popIn } from '@/components/ui/pop-in';
import { alpha, colors } from '@/theme';

type GlassTextProps = {
  text: string;
  /** Wait before popping in (ms), e.g. until a title above has finished */
  delayMs?: number;
  maxWidth?: number;
};

/** Bold text that stands out over a photo: a soft shadow underneath, letters multiplied with the photo */
export function GlassText({ text, delayMs = 0, maxWidth }: GlassTextProps) {
  return (
    <Animated.View entering={popIn(delayMs)} style={{ maxWidth }}>
      <AppText size="big" bold color={colors.ink} style={styles.text}>
        {text}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    mixBlendMode: 'multiply',
    textShadowColor: alpha(colors.ink, 0.28),
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
