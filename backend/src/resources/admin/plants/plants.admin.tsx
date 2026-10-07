import { PLANT_TRAIT_SUGGESTIONS, plantSave, type Plant, type PlantSummary, type Tip } from '@growme/shared'
import { combinationsRepo } from '../../combinations/combinations.repo'
import { plantsRepo } from '../../plants/plants.repo'
import { blogLinkOptions } from '../../blogs/blog-links'
import { tipsRepo } from '../../tips/tips.repo'
import { adminResource, numericId } from '../resource'
import {
  Choices,
  MoneyField,
  MonthRange,
  RangeField,
  Select,
  SuggestField,
  TextArea,
  TextField,
  type Option,
} from '../ui/fields'
import { snippet } from '../ui/format'
import { BlogLinkPicker } from '../ui/blog-link-picker'
import { ImagePicker } from '../ui/image-picker'
import { FormSection, ItemCard } from '../ui/pages'
import { RepeatableList } from '../ui/repeatable-list'
import { SearchOptions, SearchSelect, type SearchOption } from '../ui/search-select'
import { savePlant } from './plants.save'

const DIFFICULTY: Option[] = [
  { value: 1, label: 'Πολύ εύκολο' },
  { value: 2, label: 'Εύκολο' },
  { value: 3, label: 'Μέτριο' },
  { value: 4, label: 'Δύσκολο' },
  { value: 5, label: 'Πολύ δύσκολο' },
]

const euros = (cents: number) => (cents / 100).toLocaleString('el-GR', { maximumFractionDigits: 2 })

function priceText(p: PlantSummary) {
  if (p.priceMin == null && p.priceMax == null) return null
  if (p.priceMin != null && p.priceMax != null && p.priceMin !== p.priceMax) {
    return `${euros(p.priceMin)}–${euros(p.priceMax)} €`
  }
  return `${euros((p.priceMin ?? p.priceMax)!)} €`
}

/** A plant in the dashboard's list: cover photo, names, price and difficulty */
function PlantListItem({ item, href, deleteUrl }: { item: PlantSummary; href: string | null; deleteUrl: string }) {
  const price = priceText(item)
  return (
    <ItemCard
      title={item.name}
      lines={[item.scientificName, [price, DIFFICULTY[item.difficulty - 1]?.label].filter(Boolean).join(' · ')]}
      image={item.images[0]?.url}
      emoji="🪴"
      href={href}
      deleteUrl={deleteUrl}
    />
  )
}

/** Title + text rows (lifecycles and new tips share it); the text may link to blogs */
const TitledText = (props: { title?: string; content?: string; titleLabel: string }) => (
  <>
    <TextField field="title" value={props.title} placeholder={props.titleLabel} required />
    <TextArea field="content" value={props.content} placeholder="Κείμενο" rows={2} required blogLinks />
  </>
)

/**
 * A tip from the library: picked by typing its title, shown read-only (shared tips are edited on
 * their own page, «Επεξεργασία»)
 */
const PickedTip = ({ tip }: { tip: Tip | null }) => (
  <>
    <SearchSelect field="tipId" source="tips" value={tip?.id} text={tip?.title} placeholder="Γράψε για αναζήτηση συμβουλής…" />
    <p class="small muted picked-text" data-fill="content">
      {tip?.content}
    </p>
    <a
      class="small"
      data-fill-href="/tips/{value}"
      href={tip ? `/tips/${tip.id}` : undefined}
      hidden={!tip}
      target="_blank"
      rel="noopener"
    >
      Επεξεργασία ↗
    </a>
  </>
)

/** One trait as a fact row: emoji, then free text with suggestions */
const TraitFact = (props: { emoji: string; field: keyof typeof PLANT_TRAIT_SUGGESTIONS; label: string; value?: string | null }) => (
  <div class="fact">
    <span class="emoji" aria-hidden="true">
      {props.emoji}
    </span>
    <SuggestField
      field={props.field}
      label={props.label}
      value={props.value}
      suggestions={PLANT_TRAIT_SUGGESTIONS[props.field]}
      placeholder="Διάλεξε ή γράψε (κενό = δεν εμφανίζεται)"
      blogLinks
    />
  </div>
)

type PlantOptions = { combinations: Option[]; tips: SearchOption[]; blogs: SearchOption[] }

/** The plant form: laid out like the app's plant page (photos, name and price, facts, care, more) */
function PlantForm({ item: p, options }: { item: Plant | null; options: PlantOptions }) {
  return (
    <>
      <ImagePicker field="imageIds" images={p?.images ?? []} uploadUrl="/api/admin/images" />

      {/* Name (big) with the price on the right, the scientific name under them */}
      <div>
        <div class="title-row">
          <TextField field="name" value={p?.name} size="big" placeholder="Όνομα φυτού" required />
          <div class="row price">
            <MoneyField field="priceMin" cents={p?.priceMin} placeholder="από €" />
            <MoneyField field="priceMax" cents={p?.priceMax} placeholder="έως €" />
          </div>
        </div>
        <TextField field="scientificName" value={p?.scientificName} size="small" placeholder="Επιστημονική ονομασία" required />
      </div>

      {/* The facts card */}
      <div class="card facts">
        <div class="fact">
          <span class="emoji" aria-hidden="true">
            ☀️
          </span>
          <RangeField
            label="Ώρες ήλιου τη μέρα"
            min={{ field: 'sunlightHoursMin', value: p?.sunlightHoursMin }}
            max={{ field: 'sunlightHoursMax', value: p?.sunlightHoursMax }}
            lowest={0}
            highest={24}
            unit="ώρες"
          />
        </div>
        <div class="fact">
          <span class="emoji" aria-hidden="true">
            🌱
          </span>
          <Choices
            field="difficulty"
            label="Δυσκολία (1 εύκολο – 5 δύσκολο)"
            value={p?.difficulty ?? 1}
            options={DIFFICULTY}
          />
        </div>
        <div class="fact">
          <span class="emoji" aria-hidden="true">
            📅
          </span>
          <MonthRange
            label="Εποχή (από – έως μήνα)"
            start={{ field: 'monthStart', value: p?.monthStart }}
            end={{ field: 'monthEnd', value: p?.monthEnd }}
          />
        </div>
        <TraitFact emoji="🍅" field="food" label="Φαγώσιμο" value={p?.food} />
        <TraitFact emoji="🌰" field="seeds" label="Πώς ξεκινά" value={p?.seeds} />
        <TraitFact emoji="📍" field="native" label="Προέλευση" value={p?.native} />
      </div>

      <RepeatableList
        field="lifecycles"
        title="🌱 Κύκλος ζωής"
        itemLabel="Στάδιο"
        items={p?.lifecycles ?? []}
        sortable
        soft
        emptyText="Πρόσθεσε στάδια, π.χ. «Πρώτα άνθη» – «1 μήνας»."
        renderItem={(l) => <TitledText title={l?.title} content={l?.content} titleLabel="Στάδιο (π.χ. Πρώτα άνθη)" />}
      />

      <RepeatableList
        field="tips"
        title="Συμβουλές"
        itemLabel="Συμβουλή"
        items={p?.tips ?? []}
        sortable
        rowIds={false}
        emptyText="Διάλεξε μια συμβουλή από τη βιβλιοθήκη ή γράψε μια νέα."
        renderItem={(t) => <PickedTip tip={t} />}
        variants={[
          { key: 'pick', label: 'Υπάρχουσα', render: () => <PickedTip tip={null} /> },
          { key: 'new', label: 'Νέα', render: () => <TitledText titleLabel="Τίτλος συμβουλής" /> },
        ]}
      />
      <SearchOptions source="tips" options={options.tips} />

      <RepeatableList
        field="diseases"
        title="Ασθένειες"
        itemLabel="Ασθένεια"
        items={p?.diseases ?? []}
        renderItem={(d) => (
          <>
            <div class="row">
              <TextField field="title" value={d?.title} placeholder="Ασθένεια" required />
              <TextField field="label" value={d?.label} placeholder="Ετικέτα (προαιρετική)" nullable maxLength={100} />
            </div>
            <TextArea
              field="content"
              value={d?.content}
              placeholder="Τι κάνει και πώς αντιμετωπίζεται"
              rows={2}
              required
              blogLinks
            />
          </>
        )}
      />

      <FormSection title="Περιγραφή">
        <TextArea field="description" value={p?.description} placeholder="Λίγα λόγια για το φυτό" rows={4} nullable blogLinks />
      </FormSection>

      <FormSection title="Συνδυασμοί">
        <Select field="combinationId" value={p?.combinationId} options={options.combinations} none="Κανένας" />
      </FormSection>

      <BlogLinkPicker options={options.blogs} />
    </>
  )
}

/** Plants on the dashboard: list, create, edit, delete (all behind Cloudflare Access) */
export const plantsAdmin = adminResource({
  path: 'plants',
  title: 'Φυτά',
  list: (ctx, page) => plantsRepo.list(ctx, page, {}),
  remove: async (ctx, raw) => {
    const id = numericId(raw)
    return id !== null && plantsRepo.remove(ctx, id)
  },
  ListItem: PlantListItem,
  edit: {
    singular: 'φυτό',
    schema: plantSave,
    get: (ctx, id) => plantsRepo.get(ctx, id),
    save: savePlant,
    options: async (ctx): Promise<PlantOptions> => {
      const [combinations, tips, blogs] = await Promise.all([
        combinationsRepo.list(ctx, null, undefined),
        tipsRepo.list(ctx, null, undefined),
        blogLinkOptions(ctx.db),
      ])
      return {
        combinations: combinations.items.map((c) => ({ value: c.id, label: c.title })),
        tips: tips.items.map((t) => ({
          value: t.id,
          label: t.title,
          hint: `${snippet(t.content, 80)} · σε ${t.plantCount} ${t.plantCount === 1 ? 'φυτό' : 'φυτά'}`,
          data: { content: t.content },
        })),
        blogs,
      }
    },
    itemTitle: (p) => p.name,
    Form: PlantForm,
  },
})
