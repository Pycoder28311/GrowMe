import type { TableCount } from './admin.repo'
import { AdminLayout } from './ui/layout'

/**
 * The dashboard's home: one big tile per table with its row count, opening that table's page; tables
 * with a form also get «+ Δημιουργία» on their tile, straight to the empty form
 */
export function DashboardPage({ email, counts }: { email: string; counts: TableCount[] }) {
  return (
    <AdminLayout title="GrowMe Admin" email={email}>
      <h2>Βάση δεδομένων</h2>
      <div class="grid">
        {counts.map(({ label, path, count, create }) => (
          <div class="card tile">
            {/* The link covers the whole tile; the create button sits above it */}
            <a class="tile-link" href={path}>
              <div class="count">{count}</div>
              <div class="label">{label}</div>
            </a>
            {create && (
              <a class="button small tile-create" href={`${path}/new`}>
                + Δημιουργία
              </a>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
