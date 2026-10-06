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

/**
 * A list of rows the form sends as an array under `field` (e.g. "tips": [{ id?, title, content }]).
 * Rows are added from a <template> rendered with `renderItem(null)`, removed with ✕ and, when
 * `sortable`, ordered by dragging or ↑/↓: the array order is the position.
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
}) {
  const sortable = props.sortable ?? false
  return (
    <section class="section" data-list-wrap>
      <div class="head">
        <h2>{props.title}</h2>
        <button type="button" class="button secondary add" data-add>
          + {props.itemLabel}
        </button>
      </div>
      <ol class={props.soft ? 'list soft' : 'list'} data-list={props.field} data-sortable={sortable ? '' : undefined}>
        {props.items.map((item) => (
          <Row id={item.id} sortable={sortable} label={props.itemLabel}>
            {props.renderItem(item)}
          </Row>
        ))}
      </ol>
      <div class="list-empty">{props.emptyText ?? 'Δεν υπάρχει τίποτα ακόμα.'}</div>
      <template data-template>
        <Row sortable={sortable} label={props.itemLabel}>
          {props.renderItem(null)}
        </Row>
      </template>
    </section>
  )
}
