import { blogLinkIds, tipSave, type Tip, type TipSummary } from '@growme/shared'
import { asc, eq } from 'drizzle-orm'
import { plants, plantTips, tips } from '../../../db/schema'
import { assertBlogLinks, blogLinkOptions } from '../../blogs/blog-links'
import { tipsRepo } from '../../tips/tips.repo'
import { adminResource, numericId } from '../resource'
import { TextArea, TextField } from '../ui/fields'
import { snippet } from '../ui/format'
import { BlogLinkPicker } from '../ui/blog-link-picker'
import { FormSection, ItemCard } from '../ui/pages'
import type { SearchOption } from '../ui/search-select'

/** A tip with the plants that show it (for «Χρησιμοποιείται σε») */
type TipWithPlants = Tip & { plants: { id: number; name: string }[] }

const plantsText = (n: number) => (n === 0 ? 'Σε κανένα φυτό' : `Σε ${n} ${n === 1 ? 'φυτό' : 'φυτά'}`)

function TipListItem({ item, href, deleteUrl }: { item: TipSummary; href: string | null; deleteUrl: string }) {
  return (
    <ItemCard
      title={item.title}
      lines={[snippet(item.content), plantsText(item.plantCount)]}
      emoji="💡"
      href={href}
      deleteUrl={deleteUrl}
    />
  )
}

/** The tip form: title and text; an existing tip lists the plants it is on */
function TipForm({ item: t, options }: { item: TipWithPlants | null; options: SearchOption[] }) {
  return (
    <>
      <TextField field="title" value={t?.title} size="big" placeholder="Τίτλος συμβουλής" required />
      <TextArea field="content" value={t?.content} placeholder="Η συμβουλή" rows={6} required blogLinks />
      <BlogLinkPicker options={options} />
      {t && (
        <FormSection title="Χρησιμοποιείται σε">
          {t.plants.length === 0 ? (
            <p class="small muted">Σε κανένα φυτό ακόμα. Πρόσθεσέ τη από τη φόρμα ενός φυτού.</p>
          ) : (
            <div class="meta">
              {t.plants.map((p) => (
                <a class="badge" href={`/plants/${p.id}`}>
                  🪴 {p.name}
                </a>
              ))}
            </div>
          )}
          <p class="small muted">Οι αλλαγές εδώ φαίνονται σε όλα αυτά τα φυτά. Η διαγραφή τη βγάζει από όλα.</p>
        </FormSection>
      )}
    </>
  )
}

/** The tips library on the dashboard: list, create, edit, delete (a deleted tip leaves every plant) */
export const tipsAdmin = adminResource({
  path: 'tips',
  title: 'Συμβουλές',
  list: (ctx, page) => tipsRepo.list(ctx, page, undefined),
  remove: async (ctx, raw) => {
    const id = numericId(raw)
    return id !== null && tipsRepo.remove(ctx, id)
  },
  ListItem: TipListItem,
  edit: {
    singular: 'συμβουλή',
    newTitle: 'Νέα συμβουλή',
    schema: tipSave,
    async get(ctx, id): Promise<TipWithPlants | null> {
      const tip = await tipsRepo.get(ctx, id)
      if (!tip) return null
      const used = await ctx.db
        .select({ id: plants.id, name: plants.name })
        .from(plantTips)
        .innerJoin(plants, eq(plants.id, plantTips.plantId))
        .where(eq(plantTips.tipId, id))
        .orderBy(asc(plants.name))
      return { ...tip, plants: used }
    },
    async save(ctx, id, input) {
      await assertBlogLinks(ctx.db, [{ path: 'content', ids: blogLinkIds(input.content) }])
      if (id === null) return { id: (await ctx.db.insert(tips).values(input).returning({ id: tips.id }).get()).id }
      const row = await ctx.db.update(tips).set(input).where(eq(tips.id, id)).returning({ id: tips.id }).get()
      return row ?? null
    },
    options: (ctx) => blogLinkOptions(ctx.db),
    itemTitle: (t) => t.title,
    Form: TipForm,
  },
})
