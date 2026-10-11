import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { LensFlight, type LensFlightSpec } from "@/components/motion/lens-flight";

type FlyLens = (flight: LensFlightSpec & { onLanded: () => void }) => void;

const FlightContext = createContext<FlyLens | null>(null);

/**
 * Lets a page open the next page from something tapped, over everything, one at a time:
 * `flyLens({ glyph, rect, front, preview, onLanded })` sends the search glyph into the result and
 * opens the page out of its lens (LensFlight, the search's results), then calls `onLanded` (open the
 * page there) and fades away.
 */
export function FlightProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(LensFlightSpec & { key: number }) | null>(null);
  const landed = useRef<() => void>(() => {});
  const next = useRef(0);

  const flyLens = useCallback<FlyLens>(({ onLanded, ...spec }) => {
    landed.current = onLanded;
    next.current += 1;
    setCurrent({ ...spec, key: next.current });
  }, []);

  const value = useMemo(() => flyLens, [flyLens]);

  return (
    <FlightContext value={value}>
      <View style={styles.root}>
        {children}
        {current && (
          <LensFlight
            key={current.key}
            flight={current}
            onLanded={() => landed.current()}
            onDone={() => setCurrent(null)}
          />
        )}
      </View>
    </FlightContext>
  );
}

/** Opens a search result through the search glyph's lens */
export function useLensFlight() {
  const flyLens = use(FlightContext);
  if (!flyLens) throw new Error("useLensFlight must be used inside FlightProvider");
  return flyLens;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
