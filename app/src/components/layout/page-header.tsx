import { useFocusEffect } from 'expo-router';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type PageHeader = {
  node: ReactNode;
  setNode: (node: ReactNode) => void;
  searching: boolean;
  setSearching: (searching: boolean) => void;
};

const PageHeaderContext = createContext<PageHeader | null>(null);

/** The space between the leaf and the search button, which a page can fill (e.g. the plant page's section bar) */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode>(null);
  const [searching, setSearching] = useState(false);
  return <PageHeaderContext value={{ node, setNode, searching, setSearching }}>{children}</PageHeaderContext>;
}

const usePageHeaderContext = () => {
  const value = use(PageHeaderContext);
  if (!value) throw new Error('Page header hooks must be used inside PageHeaderProvider');
  return value;
};

/** Puts `node` between the corner buttons while the page is focused */
export function usePageHeader(node: ReactNode) {
  const { setNode } = usePageHeaderContext();
  useFocusEffect(
    useCallback(() => {
      setNode(node);
      return () => setNode(null);
    }, [node, setNode]),
  );
}

/** The search tells the header when it is open (the slot hides then) */
export const useSetSearching = () => usePageHeaderContext().setSearching;

/** Where the page's header content shows: between the corners, at their height; hidden while searching */
export function PageHeaderSlot({ top, side, height }: { top: number; side: number; height: number }) {
  const { node, searching } = usePageHeaderContext();
  if (!node) return null;
  return (
    <View
      pointerEvents={searching ? 'none' : 'box-none'}
      style={[styles.slot, { top, left: side, right: side, height, opacity: searching ? 0 : 1 }]}>
      {node}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    justifyContent: 'center',
  },
});
