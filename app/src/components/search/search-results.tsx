import { useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, Keyframe, LinearTransition } from 'react-native-reanimated';

import { ResultRowContent, type SearchResult } from '@/components/search/result-row';
import { AppText } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { PressableScale } from '@/components/ui/pressable-scale';
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
import { colors, radius, shadow, space } from '@/theme';

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
        <View ref={ref} collapsable={false} style={styles.card}>
          <ResultRowContent result={result} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** A list's label with its count; «Κανένα …» when it has none */
function Group(props: {
  label: string;
  empty: string;
  results: SearchResult[];
  onPick: (result: SearchResult, rect: Rect) => void;
  /** Not the first list: a bigger gap above its header */
  later?: boolean;
}) {
  return (
    <View style={[styles.group, props.later && styles.later]}>
      <Animated.View layout={move} style={styles.header}>
        <AppText size="small" bold color={colors.inkMuted} accessibilityRole="header" style={styles.center}>
          {props.label} ({props.results.length})
        </AppText>
      </Animated.View>
      {props.results.map((result) => (
        <Row key={`${result.type}-${result.item.id}`} result={result} onPick={props.onPick} />
      ))}
      {props.results.length === 0 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={move}>
          <AppText size="small" color={colors.inkMuted} style={styles.center}>
            {props.empty}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

/**
 * The results under the search bar, each its own small card on the dimmed page: «Φυτά» first, then
 * «Άρθρα» (the other way round with `blogsFirst`), each under a light-gray centred header. As tall as the results; `maxHeight` keeps it above
 * the keyboard, and only then it scrolls.
 */
export function SearchResults(props: {
  matches: SearchMatches | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onPick: (result: SearchResult, rect: Rect) => void;
  maxHeight: number;
  /** «Άρθρα» above «Φυτά» (on the Encyclopedia's pages) */
  blogsFirst?: boolean;
}) {
  const { matches } = props;
  const plants: SearchResult[] = (matches?.plants ?? []).map((item) => ({ type: 'plant', item }));
  const blogs: SearchResult[] = (matches?.blogs ?? []).map((item) => ({ type: 'blog', item }));
  const none = matches && plants.length === 0 && blogs.length === 0;

  return (
    <Animated.View entering={FadeIn.duration(RESULT_ENTER_MS)} exiting={FadeOut.duration(RESULT_EXIT_MS)} style={[styles.panel, { maxHeight: props.maxHeight }]}>
      {/* flexGrow 0: as tall as its content (else the list collapses inside the maxHeight box on web) */}
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={styles.content}>
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
            {props.blogsFirst ? (
              <>
                <Group label="Άρθρα" empty="Κανένα άρθρο" results={blogs} onPick={props.onPick} />
                <Group label="Φυτά" empty="Κανένα φυτό" results={plants} onPick={props.onPick} later />
              </>
            ) : (
              <>
                <Group label="Φυτά" empty="Κανένα φυτό" results={plants} onPick={props.onPick} />
                <Group label="Άρθρα" empty="Κανένα άρθρο" results={blogs} onPick={props.onPick} later />
              </>
            )}
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
  // No panel behind the results: only the cards and headers show over the dimmed page
  // A little room round the cards so their shadows aren't clipped by the scroll view
  panel: {
    marginHorizontal: -space.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    padding: space.xs,
  },
  // Cards apart from each other; the header a little closer to its first card
  group: {
    gap: space.sm,
  },
  // More room above a list's header (after the last plant) than below it
  later: {
    marginTop: space.lg,
  },
  header: {
    marginBottom: -space.xs,
    paddingVertical: space.xs,
    borderRadius: radius.xs,
    backgroundColor: '#eceef0',
  },
  center: {
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.xs,
    boxShadow: shadow.tile,
  },
  status: {
    alignItems: 'center',
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.surface,
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
