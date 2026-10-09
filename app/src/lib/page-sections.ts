import { useCallback, useRef, useState } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

/** A section counts as seen once its top passes this much of the screen's height */
const SEEN_AT = 0.85;
/** After a jump (scrollTo), the picked section stays current until the user scrolls this far on their own */
const PIN_RELEASE = 40;
/** How long a jump's own scrolling may take */
const JUMP_MS = 700;

type SectionState = {
  /** The section at the middle of the screen */
  current: string | null;
  /** The section under the header line (just below the corner buttons) */
  atHeader: string | null;
  /** Sections that have come into view at least once (for their reveal) */
  seen: ReadonlySet<string>;
  /** Sections still entirely below the screen */
  below: ReadonlySet<string>;
};

const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) => a.size === b.size && [...a].every((id) => b.has(id));

/**
 * Where a scrolling page is, by section: each section reports its top (`register(id)` as its onLayout,
 * on a direct child of the ScrollView's content), the ScrollView gets `scrollProps` and reports its
 * offset to `onScrollY`. Re-renders only when the current section, the seen or the below sections
 * change. `headerLine`: the y on screen
 * where content starts below the header (useTopClearance). The current section is the one at the
 * screen's middle, or after `scrollTo(id)` that one, until the user scrolls away.
 */
export function usePageSections(order: readonly string[], headerLine: number) {
  const scrollRef = useRef<ScrollView>(null);
  const tops = useRef<Record<string, number>>({});
  const y = useRef(0);
  const viewport = useRef(0);
  // A picked section stays current after its jump (short sections may leave another at the middle)
  const pin = useRef<{ id: string; until: number; settledY: number | null } | null>(null);
  const [state, setState] = useState<SectionState>({ current: null, atHeader: null, seen: new Set(), below: new Set() });

  const update = useCallback(() => {
    if (viewport.current === 0) return;
    const placed = order.filter((id) => tops.current[id] !== undefined);
    const lastAbove = (line: number) => placed.filter((id) => tops.current[id] <= line).at(-1) ?? placed[0] ?? null;
    const pinned = pin.current;
    if (pinned && Date.now() > pinned.until) {
      pinned.settledY ??= y.current;
      if (Math.abs(y.current - pinned.settledY) > PIN_RELEASE) pin.current = null;
    }
    const current = pin.current?.id ?? lastAbove(y.current + viewport.current / 2);
    const atHeader = lastAbove(y.current + headerLine);
    const below = new Set(placed.filter((id) => tops.current[id] > y.current + viewport.current));
    setState((before) => {
      const seen = new Set(before.seen);
      for (const id of placed) if (tops.current[id] < y.current + viewport.current * SEEN_AT) seen.add(id);
      const same =
        before.current === current && before.atHeader === atHeader && sameSet(before.seen, seen) && sameSet(before.below, below);
      return same ? before : { current, atHeader, seen, below };
    });
  }, [order, headerLine]);

  const register = useCallback(
    (id: string) => (event: LayoutChangeEvent) => {
      tops.current[id] = event.nativeEvent.layout.y;
      update();
    },
    [update],
  );

  const scrollTo = useCallback(
    (id: string) => {
      const top = tops.current[id];
      if (top === undefined) return;
      pin.current = { id, until: Date.now() + JUMP_MS, settledY: null };
      scrollRef.current?.scrollTo({ y: Math.max(0, top - headerLine), animated: true });
      update();
    },
    [headerLine, update],
  );

  /** Call with the page's scroll offset on every scroll event */
  const onScrollY = useCallback(
    (offset: number) => {
      y.current = offset;
      update();
    },
    [update],
  );

  const scrollProps = {
    ref: scrollRef,
    onLayout: (event: LayoutChangeEvent) => {
      viewport.current = event.nativeEvent.layout.height;
      update();
    },
  };

  return { ...state, register, scrollTo, onScrollY, scrollProps, scrollRef, scrollY: y };
}
