import type { RichDoc } from '@growme/shared'
import type { Child } from 'hono/jsx'
import { ASSETS } from './layout'

type Tool = { cmd: string; label: string; icon: Child }

/** Lucide's "link" icon (ISC licence, the set react-icons ships as Lu): two chain links */
const LinkIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

/** Word's alignment icons: four lines, short ones placed left, centered, right, or all full width */
function AlignIcon({ short }: { short: 'left' | 'center' | 'right' | null }) {
  // x-range of the 2nd and 4th (shorter) lines
  const [x1, x2] = short === 'left' ? [3, 15] : short === 'center' ? [6, 18] : short === 'right' ? [9, 21] : [3, 21]
  return (
    <svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d={`M3 5h18M${x1} 10h${x2 - x1}M3 15h18M${x1} 20h${x2 - x1}`}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  )
}

// Toolbar groups, left to right (the editor script runs each data-cmd)
const TOOLS: Tool[][] = [
  [
    { cmd: 'undo', label: 'Αναίρεση', icon: '↶' },
    { cmd: 'redo', label: 'Επανάληψη', icon: '↷' },
  ],
  [
    { cmd: 'paragraph', label: 'Κανονικό κείμενο', icon: '¶' },
    { cmd: 'h2', label: 'Επικεφαλίδα', icon: 'H2' },
    { cmd: 'h3', label: 'Υπότιτλος', icon: 'H3' },
  ],
  [
    { cmd: 'bold', label: 'Έντονα', icon: 'B' },
    { cmd: 'italic', label: 'Πλάγια', icon: 'I' },
    { cmd: 'underline', label: 'Υπογράμμιση', icon: 'U' },
    { cmd: 'strike', label: 'Διακριτή διαγραφή', icon: 'S' },
    { cmd: 'link', label: 'Σύνδεσμος', icon: <LinkIcon /> },
  ],
  [
    { cmd: 'bulletList', label: 'Λίστα με κουκκίδες', icon: '•≡' },
    { cmd: 'orderedList', label: 'Αριθμημένη λίστα', icon: '1≡' },
    { cmd: 'blockquote', label: 'Παράθεση', icon: '❝' },
    { cmd: 'horizontalRule', label: 'Οριζόντια γραμμή', icon: '―' },
  ],
  [
    { cmd: 'alignLeft', label: 'Στοίχιση αριστερά', icon: <AlignIcon short="left" /> },
    { cmd: 'alignCenter', label: 'Στοίχιση στο κέντρο', icon: <AlignIcon short="center" /> },
    { cmd: 'alignRight', label: 'Στοίχιση δεξιά', icon: <AlignIcon short="right" /> },
    { cmd: 'alignJustify', label: 'Πλήρης στοίχιση', icon: <AlignIcon short={null} /> },
  ],
]

/**
 * Add or edit a link: the text people see and the address it opens. The editor script fills it from
 * the selection (or the link under the cursor) and applies it. Its inputs have no data-field, so the
 * form never sends them.
 */
function LinkDialog() {
  return (
    <dialog class="link-dialog" data-link-dialog aria-label="Σύνδεσμος">
      <h3>Σύνδεσμος</h3>
      <label class="field">
        <span class="caption">Κείμενο που εμφανίζεται</span>
        <input type="text" maxlength={500} placeholder="π.χ. Δες το κατάστημα" data-link-text />
      </label>
      <label class="field">
        <span class="caption">Διεύθυνση (URL)</span>
        <input type="url" maxlength={2000} placeholder="https://" inputmode="url" data-link-href />
        <p class="error" aria-live="polite" data-link-error />
      </label>
      <div class="dialog-actions">
        <button type="button" class="button danger" data-link-remove>
          Αφαίρεση
        </button>
        <span class="spacer" />
        <button type="button" class="button secondary" data-link-cancel>
          Ακύρωση
        </button>
        <button type="button" class="button" data-link-save>
          Εφαρμογή
        </button>
      </div>
    </dialog>
  )
}

/** An empty document: what a new article starts with */
export const EMPTY_DOC: RichDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

/**
 * A Word-like text editor (Tiptap, loaded only on pages that use it). The document travels as JSON in
 * a hidden input under `field`, so admin.client.js sends it like any other field and shows the
 * server's errors for it below the editor.
 */
export function RichTextEditor(props: { field: string; value: RichDoc; label: string; placeholder?: string }) {
  return (
    <div class="field rich" data-rich-editor data-label={props.label} data-placeholder={props.placeholder ?? ''}>
      <div class="toolbar" role="toolbar" aria-label="Μορφοποίηση κειμένου" data-toolbar>
        {TOOLS.map((group) => (
          <div class="tool-group">
            {group.map((tool) => (
              <button
                type="button"
                class={`tool tool-${tool.cmd}`}
                data-cmd={tool.cmd}
                title={tool.label}
                aria-label={tool.label}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div class="rich-area" data-editor-area />
      <input type="hidden" data-field={props.field} data-type="json" value={JSON.stringify(props.value)} />
      <noscript>
        <p class="small muted">Ο επεξεργαστής κειμένου χρειάζεται JavaScript.</p>
      </noscript>
      <p class="error" aria-live="polite" />
      <LinkDialog />
      <script src={`${ASSETS.editor.path}?v=${ASSETS.editor.version}`} defer />
    </div>
  )
}
