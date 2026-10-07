// Links to blogs inside plain texts, written as `[visible words](blog:12)`. The text is stored as
// typed; the app turns the markers into links and the dashboard checks that the blogs exist. In
// the article editor the same link is a normal link mark with href `blog:12` (see rich-text.ts).

/** One `[words](blog:id)`: the words can't hold brackets or a line break */
const BLOG_LINK = /\[([^[\]\n]{1,200})\]\(blog:(\d{1,9})\)/g

/** href of a blog link in the article editor (`blog:12`) */
export const BLOG_HREF = /^blog:(\d{1,9})$/

export type TextSegment = { text: string } | { text: string; blogId: number }

/** The text in order: plain parts and links (anything malformed stays plain text) */
export function parseBlogLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let last = 0
  for (const match of text.matchAll(BLOG_LINK)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) })
    segments.push({ text: match[1], blogId: Number(match[2]) })
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}

/** What a reader sees: the links' words without their markers */
export const stripBlogLinks = (text: string) => text.replace(BLOG_LINK, '$1')

/** Length of what a reader sees (limits count this, not the markers) */
export const visibleLength = (text: string) => stripBlogLinks(text).length

/** The blogs a text links to (each once) */
export function blogLinkIds(text: string | null | undefined): number[] {
  if (!text) return []
  return [...new Set([...text.matchAll(BLOG_LINK)].map((m) => Number(m[2])))]
}

/** The blog id of an editor link's href, or null for other links */
export function blogIdOfHref(href: string): number | null {
  const match = href.match(BLOG_HREF)
  return match ? Number(match[1]) : null
}
