import { useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, Keyframe, LinearTransition } from 'react-native-reanimated';

import { ResultRowContent, type SearchResult } from '@/components/search/result-row';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { card } from '@/components/ui/styles';
import {
  RESULT_ENTER_EASING,
  RESULT_ENTER_MS,
  RESULT_ENTER_RISE,
  RESULT_ENTER_SCALE,
  RESULT_EXIT_DROP,
  RESULT_EXIT_EASING,
  RESULT_EXIT_MS,
  RESULT_EXIT_SCALE,
  RESULT_MOVE_EASING,
  RESULT_MOVE_MS,
  type Rect,
} from '@/config/search-motion';
import type { SearchMatches } from '@/lib/search-match';
import { colors, space } from '@/theme';

// A row arrives small and a little above its place, and leaves shrinking and dropping (the
// Portfolio's navbar-result-enter / navbar-result-exit); rows that stay slide to their new place
const enter = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -RESULT_ENTER_RISE }, { scale: RESULT_ENTER_SCALE }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: Easing.bezier(...RESULT_ENTER_EASING) },
}).duration(RESULT_ENTER_MS);
const exit = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  100: { opacity: 0, transform: [{ translateY: RESULT_EXIT_DROP }, { scale: RESULT_EXIT_SCALE }], easing: Easing.bezier(...RESULT_EXIT_EASING) },
}).duration(RESULT_EXIT_MS);
const move = LinearTransition.duration(RESULT_MOVE_MS).easing(Easing.bezier(...RESULT_MOVE_EASING));

/** One result: tapping it hands its place on screen to the flight */
function Row({ result, onPick }: { result: SearchResult; onPick: (result: SearchResult, rect: Rect) => void }) {
  const ref = useRef<View>(null);
  return (
    <Animated.View entering={enter} exiting={exit} layout={move}>
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel={result.item.name}
        pressedScale={0.98}
        onPress={() =>
          ref.current?.measureInWindow((left, top, width, height) => onPick(result, { left, top, width, height }))
        }>
        <View ref={ref} collapsable={false}>
          <ResultRowContent result={result} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** A list's label with its count; «Κανένα …» when it has none */
function Group(props: { label: string; empty: string; results: SearchResult[]; onPick: (result: SearchResult, rect: Rect) => void }) {
  return (
    <View style={styles.group}>
      <Animated.View layout={move}>
        <AppText size="small" bold color={colors.primary} accessibilityRole="header">
          {props.label} ({props.results.length})
        </AppText>
      </Animated.View>
      {props.results.map((result) => (
        <Row key={`${result.type}-${result.item.id}`} result={result} onPick={props.onPick} />
      ))}
      {props.results.length === 0 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={move}>
          <AppText size="small" color={colors.inkMuted}>
            {props.empty}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

/**
 * The results under the search bar: «Φυτά» first, then «Άρθρα». `maxHeight` keeps it above the
 * keyboard; it scrolls when longer.
 */
export function SearchResults(props: {
  matches: SearchMatches | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onPick: (result: SearchResult, rect: Rect) => void;
  maxHeight: number;
}) {
  const { matches } = props;
  const plants: SearchResult[] = (matches?.plants ?? []).map((item) => ({ type: 'plant', item }));
  const blogs: SearchResult[] = (matches?.blogs ?? []).map((item) => ({ type: 'blog', item }));
  const none = matches && plants.length === 0 && blogs.length === 0;

  return (
    <Animated.View entering={FadeIn.duration(RESULT_ENTER_MS)} exiting={FadeOut.duration(RESULT_EXIT_MS)} style={[styles.panel, { maxHeight: props.maxHeight }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {props.error ? (
          <View style={styles.status}>
            <AppText size="small" color={colors.inkMuted}>
              Η αναζήτηση δεν είναι διαθέσιμη τώρα.
            </AppText>
            <PillButton label="Δοκίμασε ξανά" onPress={props.onRetry} />
          </View>
        ) : props.loading || !matches ? (
          <ActivityIndicator color={colors.primary} style={styles.status} />
        ) : (
          <>
            <Group label="Φυτά" empty="Κανένα φυτό" results={plants} onPick={props.onPick} />
            <Group label="Άρθρα" empty="Κανένα άρθρο" results={blogs} onPick={props.onPick} />
          </>
        )}
      </ScrollView>
      {/* Read out how many results there are */}
      <AppText accessibilityLiveRegion="polite" style={styles.hidden}>
        {none ? 'Δεν βρέθηκε τίποτα' : matches ? `${plants.length} φυτά, ${blogs.length} άρθρα` : ''}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...card,
    overflow: 'hidden',
  },
  content: {
    gap: space.md,
    padding: space.sm,
  },
  group: {
    gap: space.xs,
  },
  status: {
    alignItems: 'flex-start',
    gap: space.xs,
    padding: space.sm,
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
