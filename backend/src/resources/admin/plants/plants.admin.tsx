import {
  DIFFICULTY_LABELS,
  EFFORT_LEVELS,
  LIFECYCLE_TABS,
  LIFECYCLE_TAB_LABELS,
  MAX_MONTH_RANGES,
  POT_SIZES,
  POT_SIZE_LABELS,
  SEASON_FIELDS,
  SEASON_LABELS,
  SUN_BARS,
  SUN_MAX_HOUR,
  SUN_MIN_HOUR,
  TIME_NEEDED_LABELS,
  TOLERANCES,
  TOLERANCE_LABELS,
  TOLERANCE_LEVELS,
  TOXICITY,
  TOXICITY_LABELS,
  flagDefault,
  PLANT_FLAGS,
  PLANT_TRAIT_SUGGESTIONS,
  parseRichContent,
  plantSave,
  type Lifecycle,
  type LifecycleTab,
  type Plant,
  type PlantSummary,
} from '@growme/shared'
import { combinationsRepo } from '../../combinations/combinations.repo'
import { plantsRepo } from '../../plants/plants.repo'
import { blogLinkOptions } from '../../blogs/blog-links'
import { adminResource, numericId } from '../resource'
import {
  DurationField,
  MonthPair,
  MultiChoices,
  RangeField,
  Select,
  SuggestField,
  TextArea,
  TextChoices,
  TextField,
  Toggle,
  type Option,
} from '../ui/fields'
import { BlogLinkPicker } from '../ui/blog-link-picker'
import { ImagePicker } from '../ui/image-picker'
import { FormSection, ItemCard } from '../ui/pages'
import { RepeatableList } from '../ui/repeatable-list'
import { EMPTY_DOC, RichTextEditor } from '../ui/rich-text-editor'
import { SunWindow } from '../ui/sun-window'
import type { SearchOption } from '../ui/search-select'
import { savePlant } from './plants.save'

const labelled = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }))

/** A plant in the dashboard's list: cover photo, names and difficulty */
function PlantListItem({ item, href, deleteUrl }: { item: PlantSummary; href: string | null; deleteUrl: string }) {
  const difficulty = item.difficultyLevels.map((level) => DIFFICULTY_LABELS[level]).join(', ')
  return (
    <ItemCard
      title={item.name}
      lines={[item.scientificName, difficulty]}
      image={item.images[0]?.url}
      emoji="🪴"
      href={href}
      deleteUrl={deleteUrl}
    />
  )
}

/** Title + text rows (lifecycle stages); the text may link to blogs */
const TitledText = (props: { title?: string; content?: string; titleLabel: string }) => (
  <>
    <TextField field="title" value={props.title} placeholder={props.titleLabel} required />
    <TextArea field="content" value={props.content} placeholder="Κείμενο" rows={2} required blogLinks />
  </>
)

const STAGE_BADGE: Record<LifecycleTab, string> = {
  seed: '🌰 Στάδιο σπόρου',
  plant: '🪴 Στάδιο φυτού',
  care: '💧 Περιποίηση',
}
const STAGE_SWITCH = { seed: '→ Κάν\'το στάδιο σπόρου', plant: '→ Κάν\'το στάδιο φυτού' }

/**
 * A lifecycle stage on one tab: from seed, from a ready plant (transplant) or care; its time from
 * sowing (optional), title and text. Seed and plant stages switch to each other (admin.client.js
 * switchGroup updates the hidden `tab` and the badge); care stages stay where they are.
 */
const StageFields = ({ stage, tab }: { stage?: Lifecycle | null; tab: LifecycleTab }) => {
  const other = tab === 'seed' ? 'plant' : 'seed'
  return (
    <>
      <div class="field stage-head">
        <div class="row">
          <span class="stage-badge" data-group-text>
            {STAGE_BADGE[tab]}
          </span>
          {tab !== 'care' && (
            <button
              type="button"
              class="chip-button"
              data-switch-group
              data-to={other}
              data-value-seed="seed"
              data-value-plant="plant"
              data-text-seed={STAGE_BADGE.seed}
              data-text-plant={STAGE_BADGE.plant}
              data-switch-seed={STAGE_SWITCH.seed}
              data-switch-plant={STAGE_SWITCH.plant}
            >
              {STAGE_SWITCH[other]}
            </button>
          )}
        </div>
        <input type="hidden" data-field="tab" data-type="text" data-group-value value={tab} />
        <p class="error" aria-live="polite" />
      </div>
      <DurationField field="duration" label="Πόσο μετά τη σπορά (προαιρετικό)" value={stage?.duration} unit="months" />
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

type PlantOptions = { combinations: Option[]; blogs: SearchOption[] }

/** The three texts of a disease: Τι βλέπω, Τι είναι, Τι κάνω */
const DISEASE_TEXTS = [
  ['symptoms', 'Τι βλέπω'],
  ['what', 'Τι είναι'],
  ['action', 'Τι κάνω'],
] as const

/** The plant form: laid out like the app's plant page (photos, name, facts, seasons, stages, care, more) */
function PlantForm({ item: p, options }: { item: Plant | null; options: PlantOptions }) {
  return (
    <>
      <ImagePicker field="imageIds" images={p?.images ?? []} uploadUrl="/api/admin/images" />

      {/* Name (big), the scientific name and family under it */}
      <div>
        <TextField field="name" value={p?.name} size="big" placeholder="Όνομα φυτού" required />
        <TextField field="scientificName" value={p?.scientificName} size="small" placeholder="Επιστημονική ονομασία" required />
        <TextField field="family" value={p?.family} size="small" placeholder="Οικογένεια" nullable />
      </div>

      {/* Yes/no characteristics (shown under the scientific name in the app), then frost, salt and wind */}
      <div class="card facts">
        <span class="caption">Χαρακτηριστικά</span>
        <div class="toggles">
          {PLANT_FLAGS.map((f) => (
            <Toggle field={f.key} label={f.label} emoji={f.emoji} checked={p?.[f.key] ?? flagDefault(f.key)} />
          ))}
        </div>
        {TOLERANCES.map((t) => (
          <TextChoices
            field={t.key}
            label={t.label}
            value={p?.[t.key]}
            options={labelled(TOLERANCE_LEVELS, TOLERANCE_LABELS)}
            none="Δεν ορίστηκε"
          />
        ))}
      </div>

      {/* The facts card */}
      <div class="card facts">
        {SUN_BARS.map((bar) => (
          <div class="fact">
            <span class="emoji" aria-hidden="true">
              ☀️
            </span>
            <SunWindow
              label={bar.label}
              startField={bar.start}
              endField={bar.end}
              start={p?.[bar.start]}
              end={p?.[bar.end]}
              min={SUN_MIN_HOUR}
              max={SUN_MAX_HOUR}
            />
          </div>
        ))}
        <MultiChoices field="potSizes" label="Μέγεθος γλάστρας" values={p?.potSizes ?? []} options={labelled(POT_SIZES, POT_SIZE_LABELS)} />
        <MultiChoices field="difficultyLevels" label="Δυσκολία" values={p?.difficultyLevels ?? []} options={labelled(EFFORT_LEVELS, DIFFICULTY_LABELS)} />
        <MultiChoices field="timeNeeded" label="Χρόνος που χρειάζεται" values={p?.timeNeeded ?? []} options={labelled(EFFORT_LEVELS, TIME_NEEDED_LABELS)} />
        <MultiChoices field="toxicity" label="Τοξικότητα" values={p?.toxicity ?? []} options={labelled(TOXICITY, TOXICITY_LABELS)} />
        <TraitFact emoji="📍" field="native" label="Προέλευση" value={p?.native} />
        <div class="fact">
          <span class="emoji" aria-hidden="true">
            ⏳
          </span>
          <RangeField
            label="Διάρκεια ζωής"
            min={{ field: 'lifespanMin', value: p?.lifespanMin }}
            max={{ field: 'lifespanMax', value: p?.lifespanMax }}
            lowest={1}
            highest={999}
            unit="χρόνια"
          />
        </div>
      </div>

      {SEASON_FIELDS.map((field) => (
        <RepeatableList
          field={field}
          title={`📅 ${SEASON_LABELS[field]}`}
          itemLabel="Περίοδος"
          items={(p?.[field] ?? []).map(([from, to], id) => ({ id, from, to }))}
          sortable
          rowIds={false}
          max={MAX_MONTH_RANGES}
          shape="tuple"
          skipEmpty
          addAt="foot"
          emptyText="Καμία περίοδος ακόμα. Πρόσθεσε έως τρεις (από – έως μήνα)."
          renderItem={(r) => <MonthPair from={r?.from} to={r?.to} />}
        />
      ))}

      <RepeatableList
        field="lifecycles"
        title="🌱 Κύκλος ζωής"
        itemLabel="Στάδιο"
        items={p?.lifecycles ?? []}
        sortable
        soft
        groups={LIFECYCLE_TABS.map((key) => ({ key, label: LIFECYCLE_TAB_LABELS[key] }))}
        groupOf={(l) => l.tab}
        variants={LIFECYCLE_TABS.map((tab) => ({
          key: tab,
          group: tab,
          label: STAGE_BADGE[tab],
          render: () => <StageFields tab={tab} />,
        }))}
        emptyText="Πρόσθεσε στάδια: πρώτα του σπόρου (αν ξεκινά από σπόρο), μετά του φυτού και στο τέλος την περιποίηση."
        renderItem={(l) => <StageFields stage={l} tab={l?.tab ?? 'plant'} />}
      />

      <RepeatableList
        field="diseases"
        title="Τι να προσέχεις"
        itemLabel="Θέμα"
        items={p?.diseases ?? []}
        renderItem={(d) => (
          <>
            <div class="row">
              <TextField field="title" value={d?.title} placeholder="Τι να προσέχεις (π.χ. Αφίδες)" required />
              <TextField field="label" value={d?.label} placeholder="Ετικέτα (προαιρετική)" nullable maxLength={100} />
            </div>
            {/* Formatted texts (no photos); older plain texts open as paragraphs with their blog links */}
            {DISEASE_TEXTS.map(([field, label]) => (
              <RichTextEditor
                field={field}
                label={label}
                value={d?.[field] ? parseRichContent(d[field]!) : EMPTY_DOC}
                placeholder={label}
                compact
              />
            ))}
          </>
        )}
      />

      <FormSection title="Ηξερες οτι / Μυστικό επιτυχίας">
        <TextArea field="trivia" label="Ηξερες οτι" value={p?.trivia} rows={2} maxLength={2000} nullable />
        <TextArea field="secret" label="Μυστικό επιτυχίας" value={p?.secret} rows={2} maxLength={2000} nullable />
      </FormSection>

      <FormSection title="Περιγραφή">
        {/* Formatted text (no photos); empty = no description */}
        <RichTextEditor
          field="description"
          label="Περιγραφή"
          value={p?.description ? parseRichContent(p.description) : EMPTY_DOC}
          placeholder="Λίγα λόγια για το φυτό"
          compact
        />
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
      const [combinations, blogs] = await Promise.all([
        combinationsRepo.list(ctx, null, undefined),
        blogLinkOptions(ctx.db),
      ])
      return {
        combinations: combinations.items.map((c) => ({ value: c.id, label: c.title })),
        blogs,
      }
    },
    itemTitle: (p) => p.name,
    Form: PlantForm,
  },
})
