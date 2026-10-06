import type { TableCount } from './admin.repo'
import { AdminLayout } from './ui/layout'

/** Tables that have a dashboard page; the rest show "σύντομα" until they get one */
const PAGES: Partial<Record<string, string>> = {
  plants: '/plants',
}

/** The dashboard's home: one card per table with its row count, linking to its page */
export function DashboardPage({ email, counts }: { email: string; counts: TableCount[] }) {
  return (
    <AdminLayout title="GrowMe Admin" email={email}>
      <h2>Βάση δεδομένων</h2>
      <div class="grid">
        {counts.map(({ key, label, count }) => {
          const href = PAGES[key]
          const body = (
            <>
              <div class="count">{count}</div>
              <div class="label">{href ? label : `${label} · σύντομα`}</div>
            </>
          )
          return href ? (
            <a class="card" href={href}>
              {body}
            </a>
          ) : (
            <div class="card soon">{body}</div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
