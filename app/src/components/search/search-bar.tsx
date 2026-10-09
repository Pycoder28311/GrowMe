import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useSetSearching } from '@/components/layout/page-header';
import { ResultRowContent, type SearchResult } from '@/components/search/result-row';
import { SearchResults } from '@/components/search/search-results';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { raisedTile, tileIcon } from '@/components/ui/styles';
import {
  EXPAND_EASING,
  EXPAND_MS,
  GLYPH_EASING,
  GLYPH_TURN_DEG,
  PLACEHOLDER_DROP,
  TRAVEL_MS,
  iconTravelStartMs,
  placeholderRevealWindow,
  type Rect,
} from '@/config/search-motion';
import { useFlight } from '@/lib/flight';
import { useSearchIndex } from '@/lib/search';
import { matchSearch } from '@/lib/search-match';
import { alpha, colors, fontFamily, fontSize, iconSize, radius, size, space } from '@/theme';

// The top corners: the leaf (home) on the left and the search on the right. The search moves like
// the Portfolio project's navbar search (config/search-motion.ts has every number and its source):
//   expanding   the bar grows from the icon leftwards to the leaf (1200 ms)
//   travelling  one lead before it arrives, the icon sweeps to the bar's left end turning 90°, and
//               the placeholder's letters appear as it passes them (520 ms)
//   open        typing filters plants and blogs; a tapped result grows into its page
//   collapsing  one movement back: the bar shrinks to the right and the icon rides its left edge

const PLACEHOLDER = 'Αναζήτηση φυτών και άρθρων';
const CONTROL = size.touch;
const SCRIM_MS = 300;

type Phase = 'closed' | 'expanding' | 'travelling' | 'open' | 'collapsing';

const expandTiming = { duration: EXPAND_MS, easing: Easing.bezier(...EXPAND_EASING) };
const glyphTiming = { duration: TRAVEL_MS, easing: Easing.bezier(...GLYPH_EASING) };

/** One placeholder letter: fades in and drops into place while the sweeping icon passes it */
function Letter(props: {
  char: string;
  clock: SharedValue<number>;
  window: { delayMs: number; durationMs: number } | null;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const { clock, window } = props;
  const style = useAnimatedStyle(() => {
    const progress = window ? Math.min(1, Math.max(0, (clock.get() - window.delayMs) / window.durationMs)) : 0;
    return { opacity: progress, transform: [{ translateY: -PLACEHOLDER_DROP * (1 - progress) }] };
  });
  return (
    <Animated.Text onLayout={props.onLayout} style={[styles.letter, style]}>
      {props.char === ' ' ? ' ' : props.char}
    </Animated.Text>
  );
}

/** The leaf and the search bar, laid over every signed-in page (AppShell) */
export function TopCorners({ top, onHome }: { top: number; onHome: () => void }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('closed');
  // The page's header content (between the corners) hides while the search is open
  const setSearching = useSetSearching();
  useEffect(() => setSearching(phase !== 'closed'), [phase, setSearching]);
  const [query, setQuery] = useState('');
  const [keyboard, setKeyboard] = useState(0);
  const fly = useFlight();
  const [letterCenters, setLetterCenters] = useState<(number | null)[]>(() => [...PLACEHOLDER].map(() => null));
  const inputRef = useRef<TextInput>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { index, error, load } = useSearchIndex();

  // The bar meets the leaf with the usual corner gap; no measuring needed, both corners are fixed
  const openWidth = screenWidth - 2 * space.md - CONTROL - space.sm;
  const travel = openWidth - CONTROL;

  const width = useSharedValue<number>(CONTROL);
  const glyph = useSharedValue(0); // 0 at the right end, 1 at the left end of the open bar
  const riding = useSharedValue(0); // 1 while collapsing: the icon rides the bar's left edge
  const turn = useSharedValue(0);
  const clock = useSharedValue(0); // ms into the sweep, for the placeholder letters
  const scrim = useSharedValue(0);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const open = useCallback(() => {
    if (phase !== 'closed' && phase !== 'collapsing') return;
    clearTimers();
    load();
    riding.set(0);
    scrim.set(withTiming(1, { duration: reduced ? 0 : SCRIM_MS }));
    if (reduced) {
      width.set(openWidth);
      glyph.set(1);
      turn.set(GLYPH_TURN_DEG);
      clock.set(TRAVEL_MS);
      setPhase('open');
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    const glyphStart = iconTravelStartMs(travel);
    setPhase('expanding');
    width.set(withTiming(openWidth, expandTiming));
    timers.current.push(
      setTimeout(() => {
        setPhase('travelling');
        glyph.set(withTiming(1, glyphTiming));
        turn.set(withTiming(GLYPH_TURN_DEG, glyphTiming));
        clock.set(0);
        clock.set(withTiming(TRAVEL_MS, { duration: TRAVEL_MS, easing: Easing.linear }));
        // After the render that makes the input editable (a phone ignores focus before that)
        requestAnimationFrame(() => inputRef.current?.focus());
      }, glyphStart),
      setTimeout(() => setPhase('open'), glyphStart + TRAVEL_MS),
    );
  }, [phase, clearTimers, load, reduced, openWidth, travel, width, glyph, turn, clock, scrim, riding]);

  /** Back to the corner. `instant`: no movement (a result's flight covers the screen) */
  const close = useCallback(
    (instant = false) => {
      if (phase === 'closed') return;
      clearTimers();
      inputRef.current?.blur();
      Keyboard.dismiss();
      clock.set(0);
      if (instant || reduced) {
        width.set(CONTROL);
        glyph.set(0);
        riding.set(0);
        turn.set(0);
        scrim.set(0);
        setPhase('closed');
        setQuery('');
        return;
      }
      // One movement: the icon rides the bar's left edge in as it shrinks
      riding.set(1);
      setPhase('collapsing');
      width.set(withTiming(CONTROL, expandTiming));
      turn.set(withTiming(0, expandTiming));
      scrim.set(withTiming(0, { duration: SCRIM_MS }));
      timers.current.push(
        setTimeout(() => {
          glyph.set(0);
          riding.set(0);
          setPhase('closed');
          setQuery('');
        }, EXPAND_MS),
      );
    },
    [phase, clearTimers, reduced, width, glyph, riding, turn, clock, scrim],
  );

  const searching = phase !== 'closed' && phase !== 'collapsing';
  const inputReady = phase === 'travelling' || phase === 'open';

  // Android back and Escape (web) close it
  useEffect(() => {
    if (!searching) return;
    if (Platform.OS === 'web') {
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') close();
      };
      // Capture phase, like the Portfolio: the focused input would otherwise keep the key
      window.addEventListener('keydown', onKey, true);
      return () => window.removeEventListener('keydown', onKey, true);
    }
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => back.remove();
  }, [searching, close]);

  // The results stay above the keyboard
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => setKeyboard(event.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const matches = useMemo(() => (index && query.trim() ? matchSearch(index, query) : null), [index, query]);

  // The tapped result grows into its page
  const pick = useCallback(
    (result: SearchResult, rect: Rect) => {
      fly({
        rect,
        front: <ResultRowContent result={result} />,
        onLanded: () => {
          if (result.type === 'plant')
            router.push({ pathname: '/plants/[id]', params: { id: String(result.item.id), via: 'search' } });
          else router.push({ pathname: '/wiki/[id]', params: { id: String(result.item.id) } });
        },
      });
      close(true);
    },
    [close, fly],
  );

  // Enter opens the first result, growing from the bar
  const submit = () => {
    const first: SearchResult | null = matches?.plants[0]
      ? { type: 'plant', item: matches.plants[0] }
      : matches?.blogs[0]
        ? { type: 'blog', item: matches.blogs[0] }
        : null;
    if (first) pick(first, { left: screenWidth - space.md - openWidth, top, width: openWidth, height: CONTROL });
  };

  // Each letter's reveal window, from where it sits in the open bar
  const windows = useMemo(
    () => letterCenters.map((center) => (center === null ? null : placeholderRevealWindow(center, openWidth, CONTROL))),
    [letterCenters, openWidth],
  );
  const onLetterLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width: letterWidth } = event.nativeEvent.layout;
    const center = CONTROL + x + letterWidth / 2;
    setLetterCenters((current) => (current[index] === center ? current : current.map((c, i) => (i === index ? center : c))));
  };

  const barStyle = useAnimatedStyle(() => ({ width: width.get() }));
  const glyphStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: riding.get() ? -(width.get() - CONTROL) : -(openWidth - CONTROL) * glyph.get() },
      { rotate: `${turn.get()}deg` },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.get() }));

  const panelTop = top + CONTROL + space.xs;
  const showResults = inputReady && query.trim().length > 0;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View pointerEvents={searching ? 'auto' : 'none'} style={[styles.scrim, scrimStyle]}>
        <Pressable accessibilityLabel="Κλείσιμο αναζήτησης" style={StyleSheet.absoluteFill} onPress={() => close()} />
      </Animated.View>

      <IconButton icon="leaf" label="Αρχική" onPress={onHome} style={[styles.corner, { top, left: space.md }]} />

      {showResults && (
        <View style={[styles.panel, { top: panelTop }]}>
          <SearchResults
            matches={matches}
            loading={!index && !error}
            error={error}
            onRetry={load}
            onPick={pick}
            maxHeight={screenHeight - panelTop - keyboard - space.md}
          />
        </View>
      )}

      <Animated.View
        accessibilityRole="search"
        style={[raisedTile, styles.bar, styles.corner, { top, right: space.md }, barStyle]}>
        <View style={styles.clip}>
          <View pointerEvents="none" style={[styles.placeholder, query.length > 0 && styles.hidden]}>
            {[...PLACEHOLDER].map((char, i) => (
              <Letter key={i} char={char} clock={clock} window={windows[i]} onLayout={onLetterLayout(i)} />
            ))}
          </View>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            editable={inputReady}
            accessibilityLabel={PLACEHOLDER}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.input, !inputReady && styles.hidden]}
          />
        </View>
        {/* The button itself travels, so it is pressed where it is seen */}
        <Animated.View style={[styles.glyphButton, glyphStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={searching ? 'Κλείσιμο αναζήτησης' : 'Άνοιγμα αναζήτησης'}
            accessibilityState={{ expanded: searching }}
            onPress={() => (searching ? close() : open())}
            style={styles.glyph}>
            <Icon name="search" size={iconSize.big} color={colors.ink} style={tileIcon} />
          </Pressable>
        </Animated.View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    zIndex: 10,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha(colors.ink, 0.25),
  },
  bar: {
    backgroundColor: alpha(colors.surface, 0.97),
  },
  clip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderRadius: radius.sm - 1, // inside the tile's 1 px border
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: CONTROL,
    flexDirection: 'row',
    alignItems: 'center',
  },
  letter: {
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.inkMuted,
  },
  input: {
    ...StyleSheet.absoluteFill,
    paddingLeft: CONTROL,
    paddingRight: space.sm,
    fontFamily: fontFamily.normal,
    fontSize: fontSize.normal,
    color: colors.ink,
  },
  hidden: {
    opacity: 0,
  },
  glyphButton: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: CONTROL,
    height: CONTROL,
  },
  glyph: {
    width: CONTROL,
    height: CONTROL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    zIndex: 20,
  },
});
