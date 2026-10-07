import type { SearchBlog, SearchIndex, SearchPlant } from '@growme/shared';

// Matching for the top-right search (pure: no React, no network; lib/search.ts loads the index).

const MAX_PER_LIST = 8;

/** Lowercase without accents: «Πότισμα» matches «ποτισμα», «ΡΙΓΑΝΗ» matches «ρίγανη» */
export const plainText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * The best matches of one list: every typed word must be in the item's text. Names that start with
 * the typed text come first, then names that contain it, then the rest (e.g. a scientific name
 * match), each group alphabetical. At most 8.
 */
function rank<T extends { name: string }>(items: T[], query: string, textOf: (item: T) => string): T[] {
  const typed = plainText(query.trim());
  const words = typed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const group = (item: T) => {
    const name = plainText(item.name);
    return name.startsWith(typed) ? 0 : name.includes(typed) ? 1 : 2;
  };
  return items
    .filter((item) => {
      const text = plainText(textOf(item));
      return words.every((word) => text.includes(word));
    })
    .map((item) => ({ item, group: group(item) }))
    .sort((a, b) => a.group - b.group || a.item.name.localeCompare(b.item.name, 'el'))
    .slice(0, MAX_PER_LIST)
    .map((entry) => entry.item);
}

export type SearchMatches = { plants: SearchPlant[]; blogs: SearchBlog[] };

/** The plants (by name or scientific name) and blogs (by title) that match the query */
export function matchSearch(index: SearchIndex, query: string): SearchMatches {
  return {
    plants: rank(index.plants, query, (p) => `${p.name} ${p.scientificName}`),
    blogs: rank(index.blogs, query, (b) => b.name),
  };
}

