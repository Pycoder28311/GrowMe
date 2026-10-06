import type { RichDoc } from '@growme/shared'
import { ASSETS } from './layout'

type Tool = { cmd: string; label: string; icon: string }

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
    { cmd: 'link', label: 'Σύνδεσμος', icon: '🔗' },
  ],
  [
    { cmd: 'bulletList', label: 'Λίστα με κουκκίδες', icon: '•≡' },
    { cmd: 'orderedList', label: 'Αριθμημένη λίστα', icon: '1≡' },
    { cmd: 'blockquote', label: 'Παράθεση', icon: '❝' },
    { cmd: 'horizontalRule', label: 'Οριζόντια γραμμή', icon: '―' },
  ],
  [
    { cmd: 'alignLeft', label: 'Στοίχιση αριστερά', icon: '⇤' },
    { cmd: 'alignCenter', label: 'Στοίχιση στο κέντρο', icon: '↔' },
    { cmd: 'alignRight', label: 'Στοίχιση δεξιά', icon: '⇥' },
    { cmd: 'alignJustify', label: 'Πλήρης στοίχιση', icon: '☰' },
  ],
]

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
      <script src={`${ASSETS.editor.path}?v=${ASSETS.editor.version}`} defer />
    </div>
  )
}
