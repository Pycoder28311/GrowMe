import { combinationSave, type Combination } from '@growme/shared'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { combinations, plantImages, plants } from '../../../db/schema'
import { beforeCursor, fetchLimit, mapPage, toPage } from '../../../lib/pagination'
import { combinationsRepo } from '../../combinations/combinations.repo'
import { imageUrl } from '../../images/images.repo'
import { adminResource, numericId } from '../resource'
import { TextArea, TextField } from '../ui/fields'
import { snippet } from '../ui/format'
import { FormSection, ItemCard } from '../ui/pages'
import { CheckPicker, type CheckOption } from '../ui/search-select'
import { saveCombination } from './combinations.save'

type CombinationItem = Combination & { plantCount: number }
type CombinationWithPlants = Combination & { plantIds: number[] }
/** Every plant, for the picker: its combination's title when it is in one */
type PlantChoice = { id: number; name: string; image: string | null; combinationId: number | null; combinationTitle: string | null }

function CombinationListItem({ item, href, deleteUrl }: { item: CombinationItem; href: string | null; deleteUrl: string }) {
  return (
    <ItemCard
      title={item.title}
      lines={[
        item.description && snippet(item.description),
        item.plantCount === 0 ? 'Χωρίς φυτά' : `${item.plantCount} ${item.plantCount === 1 ? 'φυτό' : 'φυτά'}`,
      ]}
      emoji="🧺"
      href={href}
      deleteUrl={deleteUrl}
    />
  )
}

/** The combination form: title, description and its plants (a plant moves here from another one) */
function CombinationForm({ item: c, options }: { item: CombinationWithPlants | null; options: PlantChoice[] }) {
  const picked = new Set(c?.plantIds ?? [])
  // This combination's plants first, then the rest by name
  const choices: CheckOption[] = [...options]
    .sort((a, b) => Number(picked.has(b.id)) - Number(picked.has(a.id)) || a.name.localeCompare(b.name, 'el'))
    .map((p) => ({
      value: p.id,
      label: p.name,
      image: p.image,
      checked: picked.has(p.id),
      note: p.combinationId && p.combinationId !== c?.id ? `στο «${p.combinationTitle}»` : null,
    }))
  return (
    <>
      <TextField field="title" value={c?.title} size="big" placeholder="Τίτλος συνδυασμού" required />
      <TextArea field="description" value={c?.description} placeholder="Περιγραφή (προαιρετική)" rows={4} nullable />
      <FormSection title="Φυτά">
        <p class="small muted">Ένα φυτό ανήκει σε έναν συνδυασμό: αν το διαλέξεις εδώ, φεύγει από τον άλλο.</p>
        <CheckPicker
          field="plantIds"
          options={choices}
          placeholder="Αναζήτηση φυτού…"
          emoji="🪴"
          emptyText="Δεν υπάρχουν φυτά ακόμα."
        />
      </FormSection>
    </>
  )
}

// Table names written out: in a one-table select drizzle prints a bare "id", which the subquery would read as plants.id
const plantCount = sql<number>`(SELECT count(*) FROM plants p WHERE p.combination_id = "combinations"."id")`

/** Combinations on the dashboard: list, create, edit (with their plants), delete */
export const combinationsAdmin = adminResource({
  path: 'combinations',
  title: 'Συνδυασμοί',
  async list(ctx, page) {
    const rows = await ctx.db
      .select({ c: combinations, plantCount })
      .from(combinations)
      .where(beforeCursor(combinations.id, page))
      .orderBy(desc(combinations.id))
      .limit(fetchLimit(page) ?? -1)
    return mapPage(
      toPage(rows, page, (r) => r.c.id),
      (r): CombinationItem => ({ ...r.c, plantCount: r.plantCount }),
    )
  },
  remove: async (ctx, raw) => {
    const id = numericId(raw)
    return id !== null && combinationsRepo.remove(ctx, id)
  },
  ListItem: CombinationListItem,
  edit: {
    singular: 'συνδυασμός',
    newTitle: 'Νέος συνδυασμός',
    schema: combinationSave,
    async get(ctx, id): Promise<CombinationWithPlants | null> {
      const combination = await combinationsRepo.get(ctx, id)
      if (!combination) return null
      const rows = await ctx.db.select({ id: plants.id }).from(plants).where(eq(plants.combinationId, id))
      return { ...combination, plantIds: rows.map((r) => r.id) }
    },
    save: saveCombination,
    async options(ctx): Promise<PlantChoice[]> {
      const rows = await ctx.db.query.plants.findMany({
        columns: { id: true, name: true, combinationId: true },
        orderBy: asc(plants.name),
        with: {
          combination: { columns: { title: true } },
          images: { orderBy: asc(plantImages.position), limit: 1, with: { image: { columns: { key: true } } } },
        },
      })
      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.images[0] ? imageUrl(ctx.env, p.images[0].image.key) : null,
        combinationId: p.combinationId,
        combinationTitle: p.combination?.title ?? null,
      }))
    },
    itemTitle: (c) => c.title,
    Form: CombinationForm,
  },
})
