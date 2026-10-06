import type { TableCount } from './admin.repo'

// The app's theme colors (app/src/theme/colors.ts), for a dashboard that looks like the app
const COLORS = {
  primary: '#2f7a3e',
  primarySoft: '#dcefe0',
  accent: '#f28c28',
  ink: '#1f3d24',
  inkMuted: 'rgba(31, 61, 36, 0.7)',
  surface: '#ffffff',
  border: '#e5e7eb',
}

const CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Source Sans 3', system-ui, sans-serif; color: ${COLORS.ink};
         background: linear-gradient(to bottom, rgba(242,140,40,.25), ${COLORS.surface} 40%); min-height: 100vh; }
  main { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  h1 { margin: 0; font-size: 24px; color: ${COLORS.primary}; }
  .who { font-size: 12px; color: ${COLORS.inkMuted}; }
  .logout { color: ${COLORS.accent}; font-weight: 700; text-decoration: none; }
  h2 { font-size: 16px; margin: 24px 0 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
  .card { background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 16px; padding: 16px;
          box-shadow: 0 3px 10px rgba(31,61,36,.1); }
  .count { font-size: 24px; font-weight: 700; color: ${COLORS.primary}; }
  .label { font-size: 12px; color: ${COLORS.inkMuted}; }
`

/** The first, read-only dashboard: who is signed in and how many rows each table has */
export function DashboardPage({ email, counts }: { email: string; counts: TableCount[] }) {
  return (
    <html lang="el">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>GrowMe Admin</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap" rel="stylesheet" />
        <style>{CSS}</style>
      </head>
      <body>
        <main>
          <header>
            <div>
              <h1>GrowMe Admin</h1>
              <div class="who">Συνδεδεμένος ως {email}</div>
            </div>
            {/* Ends the Cloudflare Access session (a path Cloudflare provides on this domain) */}
            <a class="logout" href="/cdn-cgi/access/logout">
              Αποσύνδεση
            </a>
          </header>

          <h2>Βάση δεδομένων</h2>
          <div class="grid">
            {counts.map(({ key, label, count }) => (
              <div class="card" key={key}>
                <div class="count">{count}</div>
                <div class="label">{label}</div>
              </div>
            ))}
          </div>
        </main>
      </body>
    </html>
  )
}
