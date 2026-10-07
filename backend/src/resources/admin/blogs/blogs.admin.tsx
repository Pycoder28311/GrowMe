import { BLOG_KIND_LABELS, BLOG_KINDS, blogSave, parseRichContent, readingMinutes, type Blog } from '@growme/shared'
import { blogsRepo } from '../../blogs/blogs.repo'
import { adminResource, numericId } from '../resource'
import { TextChoices, TextField } from '../ui/fields'
import { ImagePicker } from '../ui/image-picker'
import { FormSection, ItemCard } from '../ui/pages'
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

/** The blog form: laid out like the app's article page (photo, title with date and badges, formatted text) */
function BlogForm({ item: b }: { item: Blog | null }) {
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
    get: (ctx, id) => blogsRepo.get(ctx, id),
    save: saveBlog,
    options: async () => undefined,
    itemTitle: (b) => b.name,
    Form: BlogForm,
  },
})
