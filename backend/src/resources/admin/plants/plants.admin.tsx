import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  MAX_MONTH_RANGES,
  PLANT_FLAGS,
  PLANT_KIND_LABELS,
  PLANT_KINDS,
  PLANT_SIZE_LABELS,
  PLANT_SIZES,
  PLANT_TRAIT_SUGGESTIONS,
  WIND_LABELS,
  WIND_LEVELS,
  plantSave,
  type Lifecycle,
  type Plant,
  type PlantSummary,
  type Tip,
} from '@growme/shared'
import { combinationsRepo } from '../../combinations/combinations.repo'
import { plantsRepo } from '../../plants/plants.repo'
import { blogLinkOptions } from '../../blogs/blog-links'
import { tipsRepo } from '../../tips/tips.repo'
import { adminResource, numericId } from '../resource'
import {
  Choices,
  DurationField,
  MoneyField,
  MonthPair,
  Select,
  SuggestField,
  TextArea,
  TextChoices,
  TextField,
  Toggle,
  type Option,
} from '../ui/fields'
import { snippet } from '../ui/format'
import { BlogLinkPicker } from '../ui/blog-link-picker'
import { ImagePicker } from '../ui/image-picker'
import { FormSection, ItemCard } from '../ui/pages'
import { RepeatableList } from '../ui/repeatable-list'
import { SunWindow } from '../ui/sun-window'
import { SearchOptions, SearchSelect, type SearchOption } from '../ui/search-select'
import { savePlant } from './plants.save'

const DIFFICULTY: Option[] = DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] }))
const labelled = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }))

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
      lines={[item.scientificName, [price, DIFFICULTY_LABELS[item.difficulty]].filter(Boolean).join(' · ')]}
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

const STAGE_BADGE = { seed: '🌰 Στάδιο σπόρου', plant: '🪴 Στάδιο φυτού' }
const STAGE_SWITCH = { seed: '→ Κάν\'το στάδιο σπόρου', plant: '→ Κάν\'το στάδιο φυτού' }

/**
 * A lifecycle stage: a seed stage (before the plant is sold ready to transplant) or a plant stage,
 * its time from sowing, title and text. The switch moves it to the other group (admin.client.js
 * switchGroup), which also updates the hidden `seed` and the badge.
 */
const StageFields = ({ stage, seed }: { stage?: Lifecycle | null; seed: boolean }) => {
  const group = seed ? 'seed' : 'plant'
  const other = seed ? 'plant' : 'seed'
  return (
    <>
      <div class="field stage-head">
        <div class="row">
          <span class="stage-badge" data-group-text>
            {STAGE_BADGE[group]}
          </span>
          <button
            type="button"
            class="chip-button"
            data-switch-group
            data-to={other}
            data-value-seed="true"
            data-value-plant="false"
            data-text-seed={STAGE_BADGE.seed}
            data-text-plant={STAGE_BADGE.plant}
            data-switch-seed={STAGE_SWITCH.seed}
            data-switch-plant={STAGE_SWITCH.plant}
          >
            {STAGE_SWITCH[other]}
          </button>
        </div>
        <input type="hidden" data-field="seed" data-type="json" data-group-value value={String(seed)} />
        <p class="error" aria-live="polite" />
      </div>
      <DurationField field="duration" label="Πόσο μετά τη σπορά" value={stage?.duration} unit="months" />
      <TitledText title={stage?.title} content={stage?.content} titleLabel="Στάδιο (π.χ. Πρώτα άνθη)" />
    </>
  )
}

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

      {/* Yes/no characteristics (shown under the scientific name in the app), then wind, kind and size */}
      <div class="card facts">
        <span class="caption">Χαρακτηριστικά</span>
        <div class="toggles">
          {PLANT_FLAGS.map((f) => (
            <Toggle field={f.key} label={f.label} emoji={f.emoji} checked={p?.[f.key] ?? false} />
          ))}
        </div>
        <TextChoices field="wind" label="Αέρας" value={p?.wind} options={labelled(WIND_LEVELS, WIND_LABELS)} none="Δεν ορίστηκε" />
        <TextChoices field="kind" label="Είδος" value={p?.kind} options={labelled(PLANT_KINDS, PLANT_KIND_LABELS)} none="Δεν ορίστηκε" />
        <TextChoices field="size" label="Μέγεθος" value={p?.size} options={labelled(PLANT_SIZES, PLANT_SIZE_LABELS)} none="Δεν ορίστηκε" />
      </div>

      {/* The facts card */}
      <div class="card facts">
        <div class="fact">
          <span class="emoji" aria-hidden="true">
            ☀️
          </span>
          <SunWindow label="Ώρες ήλιου τη μέρα" start={p?.sunStart} end={p?.sunEnd} />
        </div>
        <div class="fact">
          <span class="emoji" aria-hidden="true">
            🌱
          </span>
          <Choices field="difficulty" label="Δυσκολία" value={p?.difficulty ?? 1} options={DIFFICULTY} labels />
        </div>
        <TraitFact emoji="📍" field="native" label="Προέλευση" value={p?.native} />
        <div class="fact">
          <span class="emoji" aria-hidden="true">
            ⏳
          </span>
          <DurationField field="lifespan" label="Διάρκεια ζωής" value={p?.lifespan} unit="years" />
        </div>
      </div>

      <RepeatableList
        field="monthRanges"
        title="📅 Εποχές"
        itemLabel="Εποχή"
        items={(p?.monthRanges ?? []).map(([from, to], id) => ({ id, from, to }))}
        sortable
        rowIds={false}
        max={MAX_MONTH_RANGES}
        shape="tuple"
        skipEmpty
        addAt="foot"
        emptyText="Καμία εποχή ακόμα. Πρόσθεσε έως τρεις (από – έως μήνα)."
        renderItem={(r) => <MonthPair from={r?.from} to={r?.to} />}
      />

      <RepeatableList
        field="lifecycles"
        title="🌱 Κύκλος ζωής"
        itemLabel="Στάδιο"
        items={p?.lifecycles ?? []}
        sortable
        soft
        groups={[
          { key: 'seed', label: 'Από σπόρο' },
          { key: 'plant', label: 'Από φυτό (μεταμφύτευση)' },
        ]}
        groupOf={(l) => (l.seed ? 'seed' : 'plant')}
        variants={[
          { key: 'seed', group: 'seed', label: 'Στάδιο σπόρου', render: () => <StageFields seed /> },
          { key: 'plant', group: 'plant', label: 'Στάδιο φυτού', render: () => <StageFields seed={false} /> },
        ]}
        emptyText="Πρόσθεσε στάδια: πρώτα του σπόρου (αν ξεκινά από σπόρο), μετά του φυτού."
        renderItem={(l) => <StageFields stage={l} seed={l?.seed ?? false} />}
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
