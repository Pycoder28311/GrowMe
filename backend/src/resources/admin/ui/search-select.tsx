import type { Child } from 'hono/jsx'

// Searchable choices for long lists (tips, plants). The options are rendered in the page once and
// admin.client.js filters them as you type (accents and case don't matter). Fine up to a few
// thousand rows; past that the search should move to the server.

/** One choice: `hint` is a second, muted line; `data` is copied onto the page when it is picked */
export type SearchOption = { value: number; label: string; hint?: string; data?: Record<string, string> }

/**
 * The options of a SearchSelect, once per page (rows added later reuse them): `source` names them.
 * Each option's `data` lands on its <li> as data-* (read by data-fill on pick).
 */
export function SearchOptions(props: { source: string; options: SearchOption[] }) {
  return (
    <ul hidden data-options={props.source}>
      {props.options.map((o) => {
        const data = Object.fromEntries(Object.entries(o.data ?? {}).map(([k, v]) => [`data-${k}`, v]))
        return <li data-value={String(o.value)} data-label={o.label} data-hint={o.hint} {...data} />
      })}
    </ul>
  )
}

/**
 * Pick one option of `source` by typing: ↑/↓ and Enter, or a click. The id goes under `field`
 * (null until one is picked). On pick, elements of the same row with data-fill="key" get the
 * option's data-key as text, and data-fill-href="/path/{value}" links get its id and show.
 * Options already picked in the same list are left out.
 */
export function SearchSelect(props: {
  field: string
  source: string
  value?: number | null
  /** The picked option's label (shown in the box) */
  text?: string
  placeholder: string
  label?: string
}) {
  return (
    <div class="field search-select" data-search-select={props.source}>
      {props.label && <span class="caption">{props.label}</span>}
      <input type="hidden" data-field={props.field} data-type="number" value={props.value == null ? '' : String(props.value)} />
      <input
        type="text"
        role="combobox"
        aria-expanded="false"
        aria-autocomplete="list"
        aria-label={props.label ?? props.placeholder}
        placeholder={props.placeholder}
        value={props.text ?? ''}
        autocomplete="off"
        data-search
      />
      <ul class="search-results" role="listbox" hidden />
      <p class="error" aria-live="polite" />
    </div>
  )
}

/** A checklist row: `note` is a muted line (e.g. «στο “Βότανα”»), `image` a small photo */
export type CheckOption = { value: number; label: string; note?: string | null; image?: string | null; checked: boolean }

/**
 * Many choices with a search box: the checked values go under `field` as an array of ids.
 * `emoji` stands in for a missing photo.
 */
export function CheckPicker(props: {
  field: string
  options: CheckOption[]
  placeholder: string
  emoji?: string
  emptyText?: string
  children?: Child
}) {
  return (
    <div class="field check-picker" data-checks={props.field}>
      <div class="row">
        <input type="text" data-filter placeholder={props.placeholder} aria-label={props.placeholder} autocomplete="off" />
        <span class="small muted picked-count" data-checked-count aria-live="polite" />
      </div>
      <ul class="checks">
        {props.options.map((o) => (
          <li data-search-text={`${o.label} ${o.note ?? ''}`}>
            <label class="check">
              <input type="checkbox" value={String(o.value)} checked={o.checked} />
              {o.image ? (
                <img class="check-thumb" src={o.image} alt="" loading="lazy" />
              ) : (
                <span class="check-thumb" aria-hidden="true">
                  {props.emoji}
                </span>
              )}
              <span class="check-text">
                <span class="name">{o.label}</span>
                {o.note && <span class="small muted">{o.note}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {props.options.length === 0 && <div class="list-empty">{props.emptyText ?? 'Δεν υπάρχει τίποτα ακόμα.'}</div>}
      <div class="list-empty hidden" data-no-match>
        Κανένα αποτέλεσμα.
      </div>
      <p class="error" aria-live="polite" />
    </div>
  )
}
