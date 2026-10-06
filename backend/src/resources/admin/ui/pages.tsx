import type { Child } from 'hono/jsx'
import { AdminLayout } from './layout'

/** An object type's list: a Create button, one card per item linking to its form, "more" for the next page */
export function ListPage(props: {
  title: string
  singular: string
  email: string
  basePath: string
  nextCursor: string | null
  children: Child[]
}) {
  return (
    <AdminLayout title={props.title} email={props.email} back={{ href: '/', label: 'Αρχική' }}>
      <div class="head-actions">
        <a class="button" href={`${props.basePath}/new`}>
          + Δημιουργία
        </a>
      </div>
      <h2>{props.title}</h2>
      {props.children.length === 0 ? (
        <div class="card empty muted">Δεν υπάρχει κανένα ακόμα. Πάτησε «Δημιουργία».</div>
      ) : (
        <div class="items">{props.children}</div>
      )}
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
