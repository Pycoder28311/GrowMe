import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";

import { GrowFlight, type Flight } from "@/components/motion/grow-flight";
import { LensFlight, type LensFlightSpec } from "@/components/motion/lens-flight";
import type { Rect } from "@/config/search-motion";

type Fly = (flight: {
  rect: Rect;
  front: ReactNode;
  onLanded: () => void;
}) => void;

type FlyLens = (flight: LensFlightSpec & { onLanded: () => void }) => void;

type Current =
  | ({ kind: "grow"; key: number } & Flight)
  | ({ kind: "lens"; key: number } & LensFlightSpec);

const FlightContext = createContext<{ fly: Fly; flyLens: FlyLens } | null>(null);

/**
 * Lets any page open the next page from something tapped, over everything, one at a time:
 * - `fly({ rect, front, onLanded })` grows `front` from `rect` to full screen (GrowFlight)
 * - `flyLens({ glyph, rect, front, preview, onLanded })` sends the search glyph into the result and
 *   opens the page out of its lens (LensFlight, the search's results)
 * Each then calls `onLanded` (open the page there) and fades away.
 */
export function FlightProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Current | null>(null);
  const landed = useRef<() => void>(() => {});
  const next = useRef(0);

  const fly = useCallback<Fly>(({ rect, front, onLanded }) => {
    landed.current = onLanded;
    next.current += 1;
    setCurrent({ kind: "grow", rect, front, key: next.current });
  }, []);

  const flyLens = useCallback<FlyLens>(({ onLanded, ...spec }) => {
    landed.current = onLanded;
    next.current += 1;
    setCurrent({ kind: "lens", ...spec, key: next.current });
  }, []);

  const value = useMemo(() => ({ fly, flyLens }), [fly, flyLens]);
  const onLanded = () => landed.current();
  const onDone = () => setCurrent(null);

  return (
    <FlightContext value={value}>
      <View style={styles.root}>
        {children}
        {current?.kind === "grow" && (
          <GrowFlight key={current.key} flight={current} onLanded={onLanded} onDone={onDone} />
        )}
        {current?.kind === "lens" && (
          <LensFlight key={current.key} flight={current} onLanded={onLanded} onDone={onDone} />
        )}
      </View>
    </FlightContext>
  );
}

const useFlights = () => {
  const value = use(FlightContext);
  if (!value) throw new Error("Flights must be used inside FlightProvider");
  return value;
};

/** Grows something tapped into its page */
export const useFlight = () => useFlights().fly;

/** Opens a search result through the search glyph's lens */
export const useLensFlight = () => useFlights().flyLens;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
