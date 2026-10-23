import { useSyncExternalStore } from 'react';

// What the posts list and an open post share: a card's place on the page, the corner × (it closes the open post
// with its own animation instead of going «back»), and whether a post is open over the list (the corner is then an ×).

export type Box = { left: number; top: number; width: number; height: number };

let closeHandler: (() => boolean) | null = null;

/** The open post registers its closing here (null when it goes away) */
export const setCloseHandler = (handler: (() => boolean) | null) => {
  closeHandler = handler;
};
/** The corner ×: true when the open post handled it (it plays its closing animation and closes by itself) */
export const runCloseHandler = () => closeHandler?.() ?? false;

let modalOpen = false;
const listeners = new Set<() => void>();

/** A post is open as a modal over the list */
export const setPostModalOpen = (open: boolean) => {
  modalOpen = open;
  listeners.forEach((listener) => listener());
};
export const usePostModalOpen = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => modalOpen,
  );
