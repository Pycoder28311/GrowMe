import type { TableCount } from './admin.repo'
import { AdminLayout } from './ui/layout'

/** The dashboard's home: one card per table with its row count, opening that table's page */
export function DashboardPage({ email, counts }: { email: string; counts: TableCount[] }) {
  return (
    <AdminLayout title="GrowMe Admin" email={email}>
      <h2>Βάση δεδομένων</h2>
      <div class="grid">
        {counts.map(({ label, path, count }) => (
          <a class="card" href={path}>
            <div class="count">{count}</div>
            <div class="label">{label}</div>
          </a>
        ))}
      </div>
    </AdminLayout>
  )
}
