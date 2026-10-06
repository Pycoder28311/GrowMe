// The Encyclopedia's tabs. The articles themselves come from the API's blogs (lib/blogs.ts);
// the database has no categories yet, so the tabs don't filter.

export type WikiCategory = 'tips' | 'glossary';

export const WIKI_TABS: { id: 'all' | WikiCategory; label: string }[] = [
  { id: 'all', label: 'Όλα' },
  { id: 'tips', label: 'Συμβουλές' },
  { id: 'glossary', label: 'Γλωσσάρι' },
];
