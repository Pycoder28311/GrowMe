import { BLOG_KIND_LABELS, BLOG_KINDS, blogSave, parseRichContent, readingMinutes, type Blog } from '@growme/shared'
import { blogLinkOptions, linkedFromCount } from '../../blogs/blog-links'
import { blogsRepo } from '../../blogs/blogs.repo'
import { adminResource, numericId } from '../resource'
import { TextChoices, TextField } from '../ui/fields'
import { ImagePicker } from '../ui/image-picker'
import { FormSection, ItemCard } from '../ui/pages'
import { SearchOptions, type SearchOption } from '../ui/search-select'
import { formatDate } from '../ui/format'
import { EMPTY_DOC, RichTextEditor, withImageSources } from '../ui/rich-text-editor'
import { saveBlog } from './blogs.save'

/** A blog in the dashboard's list: cover photo, title, date and counters */
function BlogListItem({ item, href, deleteUrl }: { item: Blog; href: string | null; deleteUrl: string }) {
  return (
    <ItemCard
      title={item.name}
      lines={[
        `${BLOG_KIND_LABELS[item.kind]} · ${formatDate(item.createdAt)}`,
        `❤️ ${item.likeCount} · 💬 ${item.commentCount}`,
      ]}
      image={item.images[0]?.url}
      emoji="📖"
      href={href}
      deleteUrl={deleteUrl}
    />
  )
}

/** A blog with the number of texts that link to it (for the delete question) */
type BlogWithLinks = Blog & { linkedFrom: number }

/**
 * The blog form: laid out like the app's article page (photo, title with date and badges, formatted
 * text). The editor's links can point to the other blogs (its «Άρθρο» tab).
 */
function BlogForm({ item: b, options }: { item: BlogWithLinks | null; options: SearchOption[] }) {
  return (
    <>
      <TextChoices
        field="kind"
        label="Είδος"
        value={b?.kind ?? 'article'}
        options={BLOG_KINDS.map((kind) => ({ value: kind, label: BLOG_KIND_LABELS[kind] }))}
        hint="Το «Μπαλκόνι» φαίνεται στην εφαρμογή με τον τίτλο κάτω από μια μικρότερη φωτογραφία."
      />

      <ImagePicker field="imageIds" images={b?.images ?? []} uploadUrl="/api/admin/images" />

      <div>
        <TextField field="name" value={b?.name} size="big" placeholder="Τίτλος άρθρου" required />
        {b && (
          <div class="meta">
            <span class="badge">📅 {formatDate(b.createdAt)}</span>
            <span class="badge">⏱ {readingMinutes(b.content)}′ ανάγνωση</span>
            <span class="badge">❤️ {b.likeCount}</span>
            <span class="badge">💬 {b.commentCount}</span>
          </div>
        )}
      </div>

      <FormSection title="Κείμενο">
        {/* Older plain-text articles open as paragraphs and are saved in the new format */}
        <RichTextEditor
          field="content"
          label="Κείμενο άρθρου"
          value={b ? withImageSources(parseRichContent(b.content), b.contentImages) : EMPTY_DOC}
          placeholder="Γράψε το άρθρο εδώ…"
          uploadUrl="/api/admin/images"
        />
      </FormSection>
      <SearchOptions source="blogs" options={options.filter((o) => o.value !== b?.id)} />
    </>
  )
}

/** Blogs (the app's Encyclopedia articles) on the dashboard: list, create, edit, delete */
export const blogsAdmin = adminResource({
  path: 'blogs',
  title: 'Άρθρα',
  list: (ctx, page) => blogsRepo.list(ctx, page, undefined),
  remove: async (ctx, raw) => {
    const id = numericId(raw)
    return id !== null && blogsRepo.remove(ctx, id)
  },
  ListItem: BlogListItem,
  edit: {
    singular: 'άρθρο',
    schema: blogSave,
    async get(ctx, id): Promise<BlogWithLinks | null> {
      const [blog, linkedFrom] = await Promise.all([blogsRepo.get(ctx, id), linkedFromCount(ctx.db, id)])
      return blog && { ...blog, linkedFrom }
    },
    save: saveBlog,
    options: (ctx) => blogLinkOptions(ctx.db),
    itemTitle: (b) => b.name,
    deleteConfirm: (b) =>
      b.linkedFrom === 0
        ? 'Να διαγραφεί οριστικά; Δεν αναιρείται.'
        : `Το άρθρο έχει συνδέσμους από ${b.linkedFrom} ${b.linkedFrom === 1 ? 'κείμενο' : 'κείμενα'}· θα γίνουν απλό κείμενο. Να διαγραφεί οριστικά;`,
    Form: BlogForm,
  },
})
