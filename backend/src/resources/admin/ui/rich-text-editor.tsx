import type { ImageRef, RichBlock, RichDoc } from '@growme/shared'
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

/** Lucide's "image" icon (ISC licence): a framed picture */
const ImageIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM21 15l-3.09-3.09a2 2 0 0 0-2.82 0L6 21"
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
    { cmd: 'image', label: 'Εικόνα (ανέβασμα αρχείου)', icon: <ImageIcon /> },
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
 * Add or edit a link: the text people see, and either a web address («Ιστοσελίδα») or another blog
 * («Άρθρο», stored as href `blog:12`; the blogs come from the page's SearchOptions source="blogs").
 * The editor script fills it from the selection (or the link under the cursor) and applies it. Its
 * inputs have no data-field, so the form never sends them.
 */
function LinkDialog() {
  return (
    <dialog class="link-dialog" data-link-dialog aria-label="Σύνδεσμος">
      <h3>Σύνδεσμος</h3>
      <label class="field">
        <span class="caption">Κείμενο που εμφανίζεται</span>
        <input type="text" maxlength={500} placeholder="π.χ. Δες το κατάστημα" data-link-text />
      </label>
      <div class="link-tabs" role="tablist">
        <button type="button" role="tab" class="link-tab" data-link-tab="web" aria-selected="true">
          Ιστοσελίδα
        </button>
        <button type="button" role="tab" class="link-tab" data-link-tab="blog" aria-selected="false">
          Άρθρο
        </button>
      </div>
      <div data-link-panel="web">
        <label class="field">
          <span class="caption">Διεύθυνση (URL)</span>
          <input type="url" maxlength={2000} placeholder="https://" inputmode="url" data-link-href />
          <p class="error" aria-live="polite" data-link-error />
        </label>
      </div>
      <div data-link-panel="blog" hidden>
        <p class="small muted" data-link-blog-current />
        <div class="field">
          <input type="text" placeholder="Αναζήτηση άρθρου…" aria-label="Αναζήτηση άρθρου" autocomplete="off" data-link-blog-search />
        </div>
        <ul class="search-results in-dialog" role="listbox" data-link-blog-results />
      </div>
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
 * The document as the editor needs it: each image block gets its URL (`src`, which is never stored:
 * the server drops it on save). Images whose file was deleted are left out.
 */
export function withImageSources(doc: RichDoc, images: ImageRef[]): object {
  const urls = new Map(images.map((i) => [i.id, i.url]))
  const blocks = (list: RichBlock[]): object[] =>
    list.flatMap((b): object[] => {
      if (b.type === 'image') {
        const src = urls.get(b.attrs.imageId)
        return src ? [{ ...b, attrs: { ...b.attrs, src } }] : []
      }
      if (b.type === 'bulletList' || b.type === 'orderedList') {
        return [{ ...b, content: b.content.map((item) => ({ ...item, content: blocks(item.content) })) }]
      }
      if (b.type === 'blockquote') return [{ ...b, content: blocks(b.content) }]
      return [b]
    })
  const content = blocks(doc.content)
  return { type: 'doc', content: content.length ? content : EMPTY_DOC.content }
}

/**
 * A Word-like text editor (Tiptap, loaded only on pages that use it). The document travels as JSON in
 * a hidden input under `field`, so admin.client.js sends it like any other field and shows the
 * server's errors for it below the editor. Without `uploadUrl` it takes no photos (no image button;
 * pasted or dropped images are ignored). `compact`: a shorter writing area (e.g. inside list rows).
 * Selected words get the «🔗 Σύνδεσμος σε άρθρο» button too when the form renders a BlogLinkPicker.
 */
export function RichTextEditor(props: {
  field: string
  /** The document, with image URLs (see withImageSources) */
  value: object
  label: string
  placeholder?: string
  /** Where the image button uploads (POST multipart "files" → [{ id, url }]); none = no photos */
  uploadUrl?: string
  compact?: boolean
}) {
  const tools = props.uploadUrl ? TOOLS : TOOLS.map((group) => group.filter((tool) => tool.cmd !== 'image'))
  return (
    <div
      class={props.compact ? 'field rich compact' : 'field rich'}
      data-rich-editor
      data-label={props.label}
      data-placeholder={props.placeholder ?? ''}
      data-upload={props.uploadUrl ?? ''}
    >
      <div class="toolbar" role="toolbar" aria-label="Μορφοποίηση κειμένου" data-toolbar>
        {tools.map((group) => (
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
      {props.uploadUrl && (
        <>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-image-file />
          <p class="small muted upload-status" aria-live="polite" data-image-status />
        </>
      )}
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
