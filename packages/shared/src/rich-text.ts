import { z } from 'zod'

// Formatted text written with the dashboard's editor (Tiptap) and shown natively by the app.
// Stored as the editor's JSON document. Only what is listed here is allowed: parsing with `richDoc`
// drops every other attribute (e.g. a link's target or class), and unknown blocks or marks fail.

export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export type RichMark =
  | { type: 'bold' | 'italic' | 'underline' | 'strike' }
  | { type: 'link'; attrs: { href: string } }

export type RichInline = { type: 'text'; text: string; marks?: RichMark[] } | { type: 'hardBreak' }

export type RichListItem = { type: 'listItem'; content: RichBlock[] }

export type RichBlock =
  | { type: 'paragraph'; attrs?: { textAlign?: TextAlign | null }; content?: RichInline[] }
  | { type: 'heading'; attrs: { level: 2 | 3; textAlign?: TextAlign | null }; content?: RichInline[] }
  | { type: 'bulletList'; content: RichListItem[] }
  | { type: 'orderedList'; attrs?: { start?: number }; content: RichListItem[] }
  | { type: 'blockquote'; content: RichBlock[] }
  | { type: 'horizontalRule' }

export type RichDoc = { type: 'doc'; content: RichBlock[] }

/** Web links and email only (no javascript: or data: links) */
const href = z
  .string()
  .trim()
  .max(2000)
  .regex(/^(https?:\/\/|mailto:)/i, 'Links must start with https://, http:// or mailto:')

const mark: z.ZodType<RichMark> = z.union([
  z.object({ type: z.enum(['bold', 'italic', 'underline', 'strike']) }),
  z.object({ type: z.literal('link'), attrs: z.object({ href }) }),
])

const inline: z.ZodType<RichInline> = z.union([
  z.object({ type: z.literal('text'), text: z.string().min(1).max(20000), marks: z.array(mark).max(10).optional() }),
  z.object({ type: z.literal('hardBreak') }),
])

const textAlign = z.enum(['left', 'center', 'right', 'justify']).nullable().optional()
const inlines = z.array(inline).max(2000).optional()

const listItem: z.ZodType<RichListItem> = z.lazy(() =>
  z.object({ type: z.literal('listItem'), content: z.array(block).min(1).max(50) }),
)

const block: z.ZodType<RichBlock> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal('paragraph'), attrs: z.object({ textAlign }).optional(), content: inlines }),
    z.object({
      type: z.literal('heading'),
      attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]), textAlign }),
      content: inlines,
    }),
    z.object({ type: z.literal('bulletList'), content: z.array(listItem).min(1).max(200) }),
    z.object({
      type: z.literal('orderedList'),
      attrs: z.object({ start: z.number().int().min(0).max(10000).optional() }).optional(),
      content: z.array(listItem).min(1).max(200),
    }),
    z.object({ type: z.literal('blockquote'), content: z.array(block).min(1).max(200) }),
    z.object({ type: z.literal('horizontalRule') }),
  ]),
)

/** How deep blocks nest (lists inside lists inside quotes…) */
function depthOf(blocks: RichBlock[], level = 1): number {
  let deepest = level
  for (const b of blocks) {
    const children =
      b.type === 'bulletList' || b.type === 'orderedList'
        ? b.content.flatMap((item) => item.content)
        : b.type === 'blockquote'
          ? b.content
          : []
    if (children.length) deepest = Math.max(deepest, depthOf(children, level + 1))
  }
  return deepest
}

const MAX_JSON_LENGTH = 200_000

/** A whole document as the editor sends it: some text, not too big, not too deeply nested */
export const richDoc: z.ZodType<RichDoc> = z
  .object({ type: z.literal('doc'), content: z.array(block).min(1).max(2000) })
  .refine((doc) => plainTextOf(doc).trim().length > 0, { message: 'Write some text' })
  .refine((doc) => depthOf(doc.content) <= 8, { message: 'Lists are nested too deeply' })
  .refine((doc) => JSON.stringify(doc).length <= MAX_JSON_LENGTH, { message: 'The text is too long' })

/** The text without formatting (for reading time, previews and search) */
export function plainTextOf(doc: RichDoc): string {
  const inlineText = (content?: RichInline[]) =>
    (content ?? []).map((node) => (node.type === 'text' ? node.text : '\n')).join('')
  const blockText = (b: RichBlock): string => {
    switch (b.type) {
      case 'paragraph':
      case 'heading':
        return inlineText(b.content)
      case 'bulletList':
      case 'orderedList':
        return b.content.map((item) => item.content.map(blockText).join('\n')).join('\n')
      case 'blockquote':
        return b.content.map(blockText).join('\n')
      case 'horizontalRule':
        return ''
    }
  }
  return doc.content.map(blockText).join('\n\n')
}

/** Plain text as a document: an empty line starts a new paragraph, a single newline breaks the line */
export function plainTextToDoc(text: string): RichDoc {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return {
    type: 'doc',
    content: (paragraphs.length ? paragraphs : ['']).map((p) => ({
      type: 'paragraph',
      content: p
        ? p.split('\n').flatMap((line, i): RichInline[] => [
            ...(i > 0 ? [{ type: 'hardBreak' as const }] : []),
            ...(line ? [{ type: 'text' as const, text: line }] : []),
          ])
        : undefined,
    })),
  }
}

/**
 * A stored text as a document: the editor's JSON, or older plain text (shown as paragraphs).
 * Never throws: anything that isn't a valid document is treated as plain text.
 */
export function parseRichContent(content: string): RichDoc {
  if (content.trimStart().startsWith('{')) {
    try {
      const parsed = richDoc.safeParse(JSON.parse(content))
      if (parsed.success) return parsed.data
    } catch {
      // not JSON: plain text below
    }
  }
  return plainTextToDoc(content)
}

/** Reading time in minutes: about 200 words a minute, at least 1 */
export function readingMinutes(content: string) {
  const words = plainTextOf(parseRichContent(content)).trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
