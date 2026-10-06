import { blogSave, type Blog } from '@growme/shared'
import { blogsRepo } from '../../blogs/blogs.repo'
import { adminResource, numericId } from '../resource'
import { TextArea, TextField } from '../ui/fields'
import { ImagePicker } from '../ui/image-picker'
import { FormSection, ItemCard } from '../ui/pages'
import { formatDate } from '../ui/format'
import { saveBlog } from './blogs.save'

/** Reading time like the app's badge: about 200 words a minute, at least 1 */
const readMinutes = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))

/** A blog in the dashboard's list: cover photo, title, date and counters */
function BlogListItem({ item, href, deleteUrl }: { item: Blog; href: string | null; deleteUrl: string }) {
  return (
    <ItemCard
      title={item.name}
      lines={[formatDate(item.createdAt), `❤️ ${item.likeCount} · 💬 ${item.commentCount}`]}
      image={item.images[0]?.url}
      emoji="📖"
      href={href}
      deleteUrl={deleteUrl}
    />
  )
}

/** The blog form: laid out like the app's article page (photo, title with date and badges, text) */
function BlogForm({ item: b }: { item: Blog | null }) {
  return (
    <>
      <ImagePicker field="imageIds" images={b?.images ?? []} uploadUrl="/api/admin/images" />

      <div>
        <TextField field="name" value={b?.name} size="big" placeholder="Τίτλος άρθρου" required />
        {b && (
          <div class="meta">
            <span class="badge">📅 {formatDate(b.createdAt)}</span>
            <span class="badge">⏱ {readMinutes(b.content)}′ ανάγνωση</span>
            <span class="badge">❤️ {b.likeCount}</span>
            <span class="badge">💬 {b.commentCount}</span>
          </div>
        )}
      </div>

      <FormSection title="Κείμενο">
        <TextArea
          field="content"
          value={b?.content}
          placeholder="Γράψε το άρθρο εδώ…"
          hint="Άφησε μια κενή γραμμή ανάμεσα στις παραγράφους."
          maxLength={50000}
          large
          required
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
