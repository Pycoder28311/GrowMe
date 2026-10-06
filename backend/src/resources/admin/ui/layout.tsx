import type { Child } from 'hono/jsx'
import ADMIN_JS from '../admin.client.js'
import EDITOR_JS from '../editor.client.js'
import { ADMIN_CSS } from './styles'

/** Short content hash, so /admin.js?v=… and /admin.css?v=… can be cached and still update on deploy */
function hash(text: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(36)
}

/** The dashboard's static files: served by admin.app.tsx, linked by AdminLayout */
export const ASSETS = {
  js: { path: '/admin.js', version: hash(ADMIN_JS), body: ADMIN_JS, type: 'text/javascript; charset=utf-8' },
  css: { path: '/admin.css', version: hash(ADMIN_CSS), body: ADMIN_CSS, type: 'text/css; charset=utf-8' },
  // The article editor (Tiptap), built by `npm run build:admin`; loaded only by RichTextEditor
  editor: { path: '/admin-editor.js', version: hash(EDITOR_JS), body: EDITOR_JS, type: 'text/javascript; charset=utf-8' },
} as const

/**
 * Every admin page: head (fonts, CSS, script), the header with who is signed in, and the content.
 * `back` adds a link above the title (e.g. back to the list).
 */
export function AdminLayout(props: {
  title: string
  email: string
  back?: { href: string; label: string }
  narrow?: boolean
  children: Child
}) {
  return (
    <html lang="el">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>{props.back ? `${props.title} · GrowMe Admin` : props.title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href={`${ASSETS.css.path}?v=${ASSETS.css.version}`} />
        <script src={`${ASSETS.js.path}?v=${ASSETS.js.version}`} defer />
      </head>
      <body>
        <main class={props.narrow ? 'narrow' : undefined}>
          <header class="top">
            <div>
              {props.back && (
                <a class="back" href={props.back.href}>
                  ← {props.back.label}
                </a>
              )}
              <h1>{props.title}</h1>
              <div class="small muted">Συνδεδεμένος ως {props.email}</div>
            </div>
            {/* Ends the Cloudflare Access session (a path Cloudflare provides on this domain) */}
            <a class="logout" href="/cdn-cgi/access/logout">
              Αποσύνδεση
            </a>
          </header>
          {props.children}
        </main>
      </body>
    </html>
  )
}
