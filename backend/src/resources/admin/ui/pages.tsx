import type { Child } from 'hono/jsx'
import { AdminLayout } from './layout'

/**
 * An object type's list: one card per item, "more" for the next page, and a Create button when the
 * type has a form (`canCreate`). Cards of types without a form have their own delete buttons.
 */
export function ListPage(props: {
  title: string
  email: string
  basePath: string
  nextCursor: string | null
  canCreate: boolean
  children?: Child
}) {
  // The JSX runtime may hand over one child or an array: count the real items either way
  const items = ([props.children] as unknown[]).flat(3).filter((c) => c != null && c !== false) as Child[]
  return (
    <AdminLayout title={props.title} email={props.email} back={{ href: '/', label: 'Αρχική' }}>
      {props.canCreate && (
        <div class="head-actions">
          <a class="button" href={`${props.basePath}/new`}>
            + Δημιουργία
          </a>
        </div>
      )}
      <h2>{props.title}</h2>
      <div class={items.length === 0 ? 'card empty muted' : 'card empty muted hidden'} data-empty>
        {props.canCreate ? 'Δεν υπάρχει κανένα ακόμα. Πάτησε «Δημιουργία».' : 'Δεν υπάρχει κανένα.'}
      </div>
      {items.length > 0 && <div class="items">{items}</div>}
      {props.nextCursor && (
        <div class="more">
          <a class="button secondary" href={`${props.basePath}?cursor=${encodeURIComponent(props.nextCursor)}`}>
            Περισσότερα
          </a>
        </div>
      )}
    </AdminLayout>
  )
}

/**
 * The create/edit form frame. admin.client.js sends it as JSON: POST `api` (new) or PUT `api/:id`,
 * shows errors under their inputs, and on success opens the saved item's page. Delete (edit only)
 * asks first, then goes back to the list.
 */
export function FormPage(props: {
  title: string
  email: string
  basePath: string
  listTitle: string
  api: string
  id: number | null
  children: Child
}) {
  const action = props.id === null ? props.api : `${props.api}/${props.id}`
  return (
    <AdminLayout title={props.title} email={props.email} narrow back={{ href: props.basePath, label: props.listTitle }}>
      <form
        class="form"
        data-admin-form
        data-action={action}
        data-method={props.id === null ? 'POST' : 'PUT'}
        data-base={props.basePath}
        novalidate
      >
        <div class="banner hidden" role="alert" data-banner />
        {props.children}
        <div class="save-bar">
          <div>
            {props.id !== null && (
              <button type="button" class="button danger" data-delete={action}>
                Διαγραφή
              </button>
            )}
            <button type="submit" class="button">
              Αποθήκευση
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}

/** A titled block inside a form (like the app's Section) */
export function FormSection(props: { title: string; children: Child }) {
  return (
    <section class="section">
      <div class="head">
        <h2>{props.title}</h2>
      </div>
      {props.children}
    </section>
  )
}

/**
 * A list item: optional photo, a title, a few short lines, and either a link to its form (`href`) or
 * a delete button (admin.client.js asks `confirm` first, deletes, then removes the card).
 */
export function ItemCard(props: {
  title: string
  lines?: (string | null | undefined)[]
  image?: string | null
  emoji?: string
  href: string | null
  deleteUrl: string
  confirm?: string
}) {
  const body = (
    <>
      {props.image ? (
        <img class="thumb" src={props.image} alt="" loading="lazy" />
      ) : (
        props.emoji && <span class="thumb">{props.emoji}</span>
      )}
      <div class="item-text">
        <div class="name">{props.title}</div>
        {(props.lines ?? []).filter(Boolean).map((line) => (
          <div class="small muted line">{line}</div>
        ))}
      </div>
    </>
  )
  if (props.href) {
    return (
      <a class="card item" href={props.href} data-item>
        {body}
      </a>
    )
  }
  return (
    <div class="card item" data-item>
      {body}
      <button
        type="button"
        class="icon-button remove"
        data-delete-item={props.deleteUrl}
        data-confirm={props.confirm ?? `Να διαγραφεί οριστικά το «${props.title}»;`}
        aria-label={`Διαγραφή: ${props.title}`}
        title="Διαγραφή"
      >
        ✕
      </button>
    </div>
  )
}
