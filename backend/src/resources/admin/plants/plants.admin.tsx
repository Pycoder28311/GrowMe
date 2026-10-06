import { plantSave, type Plant, type PlantSummary } from '@growme/shared'
import { combinationsRepo } from '../../combinations/combinations.repo'
import { plantsRepo } from '../../plants/plants.repo'
import { adminResource, numericId } from '../resource'
import {
  Choices,
  MoneyField,
  MonthRange,
  RangeField,
  Select,
  TextArea,
  TextField,
  Toggle,
  type Option,
} from '../ui/fields'
import { ImagePicker } from '../ui/image-picker'
import { FormSection, ItemCard } from '../ui/pages'
import { RepeatableList } from '../ui/repeatable-list'
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

/** Title + text rows (lifecycles and tips share it) */
const TitledText = (props: { title?: string; content?: string; titleLabel: string }) => (
  <>
    <TextField field="title" value={props.title} placeholder={props.titleLabel} required />
    <TextArea field="content" value={props.content} placeholder="Κείμενο" rows={2} required />
  </>
)

/** The plant form: laid out like the app's plant page (photos, name and price, facts, care, more) */
function PlantForm({ item: p, options }: { item: Plant | null; options: { combinations: Option[] } }) {
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
        <div class="toggles">
          <Toggle field="food" label="Τρώγεται" emoji="🍅" checked={p?.food} />
          <Toggle field="seeds" label="Από σπόρο" emoji="🌰" checked={p?.seeds} />
          <Toggle field="native" label="Ιθαγενές" emoji="📍" checked={p?.native} />
        </div>
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
        renderItem={(t) => <TitledText title={t?.title} content={t?.content} titleLabel="Τίτλος συμβουλής" />}
      />

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
            <TextArea field="content" value={d?.content} placeholder="Τι κάνει και πώς αντιμετωπίζεται" rows={2} required />
          </>
        )}
      />

      <FormSection title="Περιγραφή">
        <TextArea field="description" value={p?.description} placeholder="Λίγα λόγια για το φυτό" rows={4} nullable />
      </FormSection>

      <FormSection title="Συνδυασμοί">
        <Select field="combinationId" value={p?.combinationId} options={options.combinations} none="Κανένας" />
      </FormSection>
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
    options: async (ctx) => ({
      combinations: (await combinationsRepo.list(ctx, null, undefined)).items.map((c) => ({
        value: c.id,
        label: c.title,
      })),
    }),
    itemTitle: (p) => p.name,
    Form: PlantForm,
  },
})
