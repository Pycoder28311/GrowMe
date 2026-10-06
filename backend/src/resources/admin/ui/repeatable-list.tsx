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

function Row(props: { id?: number; sortable: boolean; label: string; children: Child }) {
  return (
    <li class="list-row" data-row>
      {props.id !== undefined && <RowId value={props.id} />}
      <div class="fields">{props.children}</div>
      <RowTools sortable={props.sortable} label={props.label} />
    </li>
  )
}

/** A kind of new row with its own add button (e.g. an existing tip or a new one) */
export type RowVariant = { key: string; label: string; render: () => Child }

/**
 * A list of rows the form sends as an array under `field` (e.g. "lifecycles": [{ id?, title, content }]).
 * Rows are added from a <template> rendered with `renderItem(null)` (or, with `variants`, one add
 * button and template per kind of row), removed with ✕ and, when `sortable`, ordered by dragging or
 * ↑/↓: the array order is the position.
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
}) {
  const sortable = props.sortable ?? false
  return (
    <section class="section" data-list-wrap>
      <div class="head">
        <h2>{props.title}</h2>
        <div class="add-buttons">
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
        </div>
      </div>
      <ol class={props.soft ? 'list soft' : 'list'} data-list={props.field} data-sortable={sortable ? '' : undefined}>
        {props.items.map((item) => (
          <Row id={props.rowIds === false ? undefined : item.id} sortable={sortable} label={props.itemLabel}>
            {props.renderItem(item)}
          </Row>
        ))}
      </ol>
      <div class="list-empty">{props.emptyText ?? 'Δεν υπάρχει τίποτα ακόμα.'}</div>
      {props.variants ? (
        props.variants.map((v) => (
          <template data-variant={v.key}>
            <Row sortable={sortable} label={props.itemLabel}>
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
