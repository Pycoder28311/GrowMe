import type { BlogKind } from '@growme/shared';

// The Encyclopedia's tabs: all articles, or one kind (the API filters by kind). The «wiki» kind has
// no tab of its own; those articles show under «Όλα».

export const WIKI_TABS: { id: 'all' | Exclude<BlogKind, 'wiki'>; label: string }[] = [
  { id: 'all', label: 'Όλα' },
  { id: 'article', label: 'Άρθρα' },
  { id: 'glossary', label: 'Γλωσσάρι' },
  { id: 'balcony', label: 'Μπαλκόνια' },
];

export type WikiTabId = (typeof WIKI_TABS)[number]['id'];
