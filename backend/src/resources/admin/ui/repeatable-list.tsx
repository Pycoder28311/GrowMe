import type { Child } from 'hono/jsx'
import { RowId } from './fields'

/**
 * Buttons on each row: a drag handle and ↑/↓ (sortable lists only) and remove. admin.client.js
 * handles them; ↑/↓ also work on touch screens and with the keyboard.
 */
function RowTools(props: { sortable: boolean; label: string }) {
  return (
    <div class="tools">
      {props.sortable && (
        <>
          <span class="handle" data-handle title="Σύρε για αλλαγή σειράς" aria-hidden="true">
            ⠿
          </span>
          <button type="button" class="icon-button" data-move="-1" aria-label={`${props.label}: πάνω`}>
            ↑
          </button>
          <button type="button" class="icon-button" data-move="1" aria-label={`${props.label}: κάτω`}>
            ↓
          </button>
        </>
      )}
      <button type="button" class="icon-button remove" data-remove aria-label={`${props.label}: αφαίρεση`}>
        ✕
      </button>
    </div>
  )
}

function Row(props: { id?: number; group?: string; sortable: boolean; label: string; children: Child }) {
  return (
    <li class="list-row" data-row data-group={props.group}>
      {props.id !== undefined && <RowId value={props.id} />}
      <div class="fields">{props.children}</div>
      <RowTools sortable={props.sortable} label={props.label} />
    </li>
  )
}

/** A kind of new row with its own add button (e.g. an existing tip or a new one); `group`: see `groups` */
export type RowVariant = { key: string; label: string; group?: string; render: () => Child }

/** A list's group: its key and the label shown above its first row (e.g. «Στάδια φυτού») */
export type RowGroup = { key: string; label: string }

/**
 * A list of rows the form sends as an array under `field` (e.g. "lifecycles": [{ id?, title, content }]).
 * Rows are added from a <template> rendered with `renderItem(null)` (or, with `variants`, one add
 * button and template per kind of row), removed with ✕ and, when `sortable`, ordered by dragging or
 * ↑/↓: the array order is the position. Moves happen only in the page; the order is saved with the form.
 *
 * - `max`: the add buttons hide when the list is full
 * - `shape="tuple"`: each row is sent as an array of its fields named "0", "1", … (e.g. [3, 5])
 * - `skipEmpty`: rows with nothing filled in are left out
 * - `groups`: rows belong to groups kept in this order (e.g. seed stages above plant stages); a new
 *   row goes to the end of its group, and drag and ↑/↓ never take a row out of it. Rows can carry a
 *   `[data-switch-group]` button that moves them to the edge of the next/previous group.
 */
export function RepeatableList<T extends { id: number }>(props: {
  field: string
  title: string
  /** Name of one row, for buttons ("Συμβουλή") */
  itemLabel: string
  items: T[]
  renderItem: (item: T | null) => Child
  sortable?: boolean
  emptyText?: string
  /** Light-green background, like the app's life cycle card */
  soft?: boolean
  /** Kinds of new rows; without it, one "+ itemLabel" button adds `renderItem(null)` */
  variants?: RowVariant[]
  /** Existing rows keep their ids (sent as `id`); false when rows are links that carry their own */
  rowIds?: boolean
  max?: number
  shape?: 'tuple'
  skipEmpty?: boolean
  groups?: RowGroup[]
  /** The group of an existing row (with `groups`) */
  groupOf?: (item: T) => string
  /** Where the add buttons are: in the header (default) or under the rows */
  addAt?: 'head' | 'foot'
}) {
  const sortable = props.sortable ?? false
  const addButtons = (
    <div class="add-buttons" data-add-buttons>
      {props.variants ? (
        props.variants.map((v) => (
          <button type="button" class="button secondary add" data-add data-variant={v.key}>
            + {v.label}
          </button>
        ))
      ) : (
        <button type="button" class="button secondary add" data-add>
          + {props.itemLabel}
        </button>
      )}
      {props.max !== undefined && <span class="small muted list-full">Έως {props.max}</span>}
    </div>
  )
  return (
    <section class="section" data-list-wrap>
      <div class="head">
        <h2>{props.title}</h2>
        {props.addAt !== 'foot' && addButtons}
      </div>
      <ol
        class={props.soft ? 'list soft' : 'list'}
        data-list={props.field}
        data-sortable={sortable ? '' : undefined}
        data-max={props.max}
        data-shape={props.shape}
        data-skip-empty={props.skipEmpty ? '' : undefined}
        data-groups={props.groups?.map((g) => g.key).join(' ')}
        data-group-labels={props.groups?.map((g) => g.label).join('|')}
      >
        {props.items.map((item) => {
          const group = props.groupOf?.(item)
          return (
            <Row id={props.rowIds === false ? undefined : item.id} group={group} sortable={sortable} label={props.itemLabel}>
              {props.renderItem(item)}
            </Row>
          )
        })}
      </ol>
      <div class="list-empty">{props.emptyText ?? 'Δεν υπάρχει τίποτα ακόμα.'}</div>
      {props.addAt === 'foot' && addButtons}
      {props.variants ? (
        props.variants.map((v) => (
          <template data-variant={v.key}>
            <Row group={v.group} sortable={sortable} label={props.itemLabel}>
              {v.render()}
            </Row>
          </template>
        ))
      ) : (
        <template data-template>
          <Row sortable={sortable} label={props.itemLabel}>
            {props.renderItem(null)}
          </Row>
        </template>
      )}
    </section>
  )
}
