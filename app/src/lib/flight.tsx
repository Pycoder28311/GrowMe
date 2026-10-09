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
import type { Rect } from "@/config/search-motion";

type Fly = (flight: {
  rect: Rect;
  front: ReactNode;
  onLanded: () => void;
}) => void;

const FlightContext = createContext<Fly | null>(null);

/**
 * Lets any page grow something tapped into the next page (GrowFlight): `fly({ rect, front, onLanded })`
 * draws `front` at `rect` over everything, grows it to full screen, then calls `onLanded` (open the
 * page there) and fades away. One flight at a time.
 */
export function FlightProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(Flight & { key: number }) | null>(
    null,
  );
  const landed = useRef<() => void>(() => {});
  const next = useRef(0);

  const fly = useCallback<Fly>(({ rect, front, onLanded }) => {
    landed.current = onLanded;
    next.current += 1;
    setCurrent({ rect, front, key: next.current });
  }, []);

  const value = useMemo(() => fly, [fly]);

  return (
    <FlightContext value={value}>
      <View style={styles.root}>
        {children}
        {current && (
          <GrowFlight
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

export function useFlight() {
  const fly = use(FlightContext);
  if (!fly) throw new Error("useFlight must be used inside FlightProvider");
  return fly;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
