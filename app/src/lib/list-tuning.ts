/**
 * Props for the long lists (posts, plants, articles): fewer rows kept rendered off screen (the default
 * window is 21 screens) and smaller batches, so scrolling and opening a page do less work. They look the same.
 */
export const LIST_TUNING = {
  initialNumToRender: 6,
  maxToRenderPerBatch: 6,
  windowSize: 9,
} as const
