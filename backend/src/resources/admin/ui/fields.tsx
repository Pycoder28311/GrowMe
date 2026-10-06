import type { Child } from 'hono/jsx'

// Form fields for admin pages. Each input carries data-field (its key in the JSON the form sends) and
// data-type (how admin.client.js reads it). Inside a RepeatableList row, keys are relative to the row
// (e.g. "title" becomes "tips.2.title"). The empty .error slot shows the server's message for that key.
//   text   → string ('' becomes null when data-nullable)   number → number or null
//   money  → euros typed, cents sent (3.5 → 350)           bool   → checkbox checked
//   id     → number, left out when empty (new list rows)
// Pickers (search-select.tsx) add: a searchable single choice (number) and a checklist (array of ids).

type Base = {
  /** Key in the JSON body, e.g. "name" (relative to the row inside lists) */
  field: string
  /** Text above the input; leave it out when the place says enough (e.g. the big name) */
  label?: string
  hint?: string
}

/** The wrapper every field shares: caption, the input, then hint and error lines */
function Field(props: { label?: string; hint?: string; class?: string; children: Child }) {
  return (
    <label class={props.class ? `field ${props.class}` : 'field'}>
      {props.label && <span class="caption">{props.label}</span>}
      {props.children}
      {props.hint && <span class="small muted">{props.hint}</span>}
      <p class="error" aria-live="polite" />
    </label>
  )
}

export function TextField(
  props: Base & {
    value?: string | null
    size?: 'big' | 'normal' | 'small'
    nullable?: boolean
    placeholder?: string
    maxLength?: number
    required?: boolean
  },
) {
  return (
    <Field label={props.label} hint={props.hint}>
      <input
        type="text"
        class={props.size && props.size !== 'normal' ? props.size : undefined}
        data-field={props.field}
        data-type="text"
        data-nullable={props.nullable ? '' : undefined}
        value={props.value ?? ''}
        placeholder={props.placeholder ?? props.label}
        aria-label={props.label ?? props.placeholder}
        maxlength={props.maxLength ?? 200}
        required={props.required}
      />
    </Field>
  )
}

export function TextArea(
  props: Base & {
    value?: string | null
    nullable?: boolean
    rows?: number
    placeholder?: string
    required?: boolean
    maxLength?: number
  },
) {
  return (
    <Field label={props.label} hint={props.hint}>
      <textarea
        data-field={props.field}
        data-type="text"
        data-nullable={props.nullable ? '' : undefined}
        rows={props.rows ?? 3}
        maxlength={props.maxLength ?? 10000}
        placeholder={props.placeholder ?? props.label}
        aria-label={props.label ?? props.placeholder}
        required={props.required}
      >
        {props.value ?? ''}
      </textarea>
    </Field>
  )
}

export function NumberField(
  props: Base & { value?: number | null; min?: number; max?: number; step?: number; placeholder?: string },
) {
  return (
    <Field label={props.label} hint={props.hint}>
      <input
        type="number"
        inputmode="numeric"
        data-field={props.field}
        data-type="number"
        value={props.value ?? ''}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        placeholder={props.placeholder}
        aria-label={props.label ?? props.placeholder}
      />
    </Field>
  )
}

/** Euros on screen, cents in the database and the API */
export function MoneyField(props: Base & { cents?: number | null; placeholder?: string }) {
  return (
    <Field label={props.label} hint={props.hint}>
      <input
        type="number"
        inputmode="decimal"
        data-field={props.field}
        data-type="money"
        value={props.cents == null ? '' : (props.cents / 100).toFixed(2)}
        min={0}
        step={0.01}
        placeholder={props.placeholder ?? '€'}
        aria-label={props.label ?? props.placeholder}
      />
    </Field>
  )
}

/**
 * Free text with suggestions (a native <datalist>: typing filters them, any other text is fine too).
 * Empty sends null.
 */
export function SuggestField(
  props: Base & { value?: string | null; suggestions: readonly string[]; placeholder?: string; maxLength?: number },
) {
  const listId = `suggest-${props.field}`
  return (
    <Field label={props.label} hint={props.hint}>
      <input
        type="text"
        list={listId}
        data-field={props.field}
        data-type="text"
        data-nullable=""
        value={props.value ?? ''}
        placeholder={props.placeholder ?? props.label}
        aria-label={props.label ?? props.placeholder}
        maxlength={props.maxLength ?? 60}
        autocomplete="off"
      />
      <datalist id={listId}>
        {props.suggestions.map((s) => (
          <option value={s} />
        ))}
      </datalist>
    </Field>
  )
}

/** A pill-shaped checkbox (true/false column) */
export function Toggle(props: Base & { checked?: boolean; emoji?: string }) {
  return (
    <label class="toggle">
      <input type="checkbox" data-field={props.field} data-type="bool" checked={props.checked} />
      {props.emoji && <span aria-hidden="true">{props.emoji}</span>}
      {props.label}
    </label>
  )
}

export type Option = { value: number; label: string }

/** A dropdown of ids; with `none`, an empty first choice that sends null */
export function Select(props: Base & { value?: number | null; options: Option[]; none?: string }) {
  return (
    <Field label={props.label} hint={props.hint}>
      <select data-field={props.field} data-type="number" aria-label={props.label}>
        {props.none !== undefined && (
          <option value="" selected={props.value == null}>
            {props.none}
          </option>
        )}
        {props.options.map((o) => (
          <option value={String(o.value)} selected={o.value === props.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/** One choice out of a few numbers, as round chips (e.g. difficulty 1–5) */
export function Choices(props: Base & { value?: number | null; options: Option[] }) {
  return (
    <div class="field" role="radiogroup" aria-label={props.label}>
      {props.label && <span class="caption">{props.label}</span>}
      <div class="choices">
        {props.options.map((o) => (
          <label class="choice" title={o.label}>
            <input
              type="radio"
              name={props.field}
              value={String(o.value)}
              data-field={props.field}
              data-type="number"
              checked={o.value === props.value}
              aria-label={o.label}
            />
            <span>{o.value}</span>
          </label>
        ))}
      </div>
      {props.hint && <span class="small muted">{props.hint}</span>}
      <p class="error" aria-live="polite" />
    </div>
  )
}

/** Two numbers side by side (from – to), each its own field */
export function RangeField(props: {
  label: string
  min: { field: string; value?: number | null }
  max: { field: string; value?: number | null }
  lowest?: number
  highest?: number
  unit?: string
}) {
  const common = { min: props.lowest, max: props.highest }
  return (
    <div class="field">
      <span class="caption">{props.label}</span>
      <div class="row">
        <NumberField field={props.min.field} value={props.min.value} placeholder="από" {...common} />
        <span class="dash">–</span>
        <NumberField field={props.max.field} value={props.max.value} placeholder="έως" {...common} />
        {props.unit && <span class="dash">{props.unit}</span>}
      </div>
    </div>
  )
}

export const MONTHS: Option[] = [
  'Ιανουάριος',
  'Φεβρουάριος',
  'Μάρτιος',
  'Απρίλιος',
  'Μάιος',
  'Ιούνιος',
  'Ιούλιος',
  'Αύγουστος',
  'Σεπτέμβριος',
  'Οκτώβριος',
  'Νοέμβριος',
  'Δεκέμβριος',
].map((label, i) => ({ value: i + 1, label }))

/** A season: start and end month (the end may come before the start, e.g. Nov–Feb) */
export function MonthRange(props: {
  label: string
  start: { field: string; value?: number | null }
  end: { field: string; value?: number | null }
}) {
  return (
    <div class="field">
      <span class="caption">{props.label}</span>
      <div class="row">
        <Select field={props.start.field} value={props.start.value} options={MONTHS} none="—" />
        <span class="dash">–</span>
        <Select field={props.end.field} value={props.end.value} options={MONTHS} none="—" />
      </div>
    </div>
  )
}

/** A hidden row id (lists): existing rows send it, new rows leave it out */
export const RowId = (props: { value?: number }) => (
  <input type="hidden" data-field="id" data-type="id" value={props.value === undefined ? '' : String(props.value)} />
)
